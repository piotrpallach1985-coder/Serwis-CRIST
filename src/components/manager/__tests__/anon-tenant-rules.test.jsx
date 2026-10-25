// @vitest-environment node
/**
 * Testy reguł: anonimowy operator QR może zgłaszać dowolnie, ale TYLKO w firmie,
 * której klucz QR zna (tenants/{t}/settings/qr_access), i tylko z dozwolonymi polami.
 * Wymaga emulatorów Firestore + Storage:  npm run test:rules
 * Bez emulatora testy są pomijane (skip), a nie fałszywie zielone.
 */
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { describe, it, beforeAll, afterAll, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';

const hasEmulator = !!process.env.FIRESTORE_EMULATOR_HOST;
const describeEmu = hasEmulator ? describe : describe.skip;
const root = path.resolve(__dirname, '../../../../');

const ANON = { firebase: { sign_in_provider: 'anonymous' } };
const KEY_A = 'klucz-firmy-A-1234567890abc';
const KEY_B = 'klucz-firmy-B-1234567890abc';
const photoUrl = (tenant, ticket, file = 'foto.jpg') =>
  `https://firebasestorage.googleapis.com/v0/b/serwis-crist.firebasestorage.app/o/tenants%2F${tenant}%2Ftickets%2F${ticket}%2F${file}?alt=media&token=abc`;

const validTicket = (uid, extra = {}) => ({
  machineId: 'mA',
  machineName: 'Dźwig A',
  bay: '',
  regionId: '',
  regionName: '',
  topic: 'Wyciek oleju',
  description: 'Cieknie spod siłownika',
  isCritical: false,
  reportedBy: 'Szybkie Zgłoszenie',
  reporterPhone: '',
  reporterDevice: 'Mozilla/5.0',
  reporterDeviceId: 'dev-1',
  reporterUid: uid,
  status: 1,
  createdAt: new Date().toISOString(),
  photos: [],
  updates: [{ timestamp: new Date().toISOString(), status: 1, comment: 'Zgłoszenie awarii w systemie.', author: 'Szybkie Zgłoszenie' }],
  ...extra,
});

let testEnv;

describeEmu('Izolacja operatora QR (anon_sessions + klucz QR firmy)', () => {
  beforeAll(async () => {
    const config = {
      projectId: 'serwis-crist',
      firestore: { rules: fs.readFileSync(path.join(root, 'firestore.rules'), 'utf8') },
    };
    if (process.env.FIREBASE_STORAGE_EMULATOR_HOST) {
      config.storage = { rules: fs.readFileSync(path.join(root, 'storage.rules'), 'utf8') };
    }
    testEnv = await initializeTestEnvironment(config);
  });

  afterAll(async () => {
    if (testEnv) await testEnv.cleanup();
  });

  beforeEach(async () => {
    await testEnv.clearFirestore();
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      const db = ctx.firestore();
      await db.doc('tenants/tenant-A/settings/qr_access').set({ key: KEY_A });
      await db.doc('tenants/tenant-B/settings/qr_access').set({ key: KEY_B });
      await db.doc('anon_sessions/anonA').set({ tenantId: 'tenant-A', qrKey: KEY_A });
      await db.doc('tenants/tenant-A/machines/mA').set({ name: 'Dźwig A', isDeleted: false });
      await db.doc('tenants/tenant-B/machines/mB').set({ name: 'Dźwig B', isDeleted: false });
      await db.doc('tenants/default/machines/mC').set({ name: 'Urządzenie Domyślne', isDeleted: false });
      await db.doc('users/adminA').set({ tenantId: 'tenant-A', role: 'admin' });
      await db.doc('users/techA').set({ tenantId: 'tenant-A', role: 'tech' });
      await db.doc('users/operA').set({ tenantId: 'tenant-A', role: 'operator' });
    });
  });

  const anonA = () => testEnv.authenticatedContext('anonA', ANON).firestore();
  const fresh = (uid = 'fresh') => testEnv.authenticatedContext(uid, ANON).firestore();

  // ---------- Pkt 1: powiązanie z firmą wymaga klucza QR ----------
  describe('Powiązanie sesji kluczem QR', () => {
    it('nowy anonim z POPRAWNYM kluczem QR wiąże się z firmą', async () => {
      await assertSucceeds(fresh().doc('anon_sessions/fresh').set({ tenantId: 'tenant-B', qrKey: KEY_B }));
    });

    it('nowy anonim BEZ klucza / ze złym kluczem NIE wiąże się z firmą', async () => {
      await assertFails(fresh().doc('anon_sessions/fresh').set({ tenantId: 'tenant-B' }));
      await assertFails(fresh().doc('anon_sessions/fresh').set({ tenantId: 'tenant-B', qrKey: KEY_A }));
      await assertFails(fresh().doc('anon_sessions/fresh').set({ tenantId: 'tenant-B', qrKey: 'zgadywanie' }));
    });

    it('anonim NIE może odczytać klucza QR firmy', async () => {
      await assertFails(anonA().doc('tenants/tenant-A/settings/qr_access').get());
    });

    it('anonim NIE może przepiąć ani usunąć swojej sesji', async () => {
      await assertFails(anonA().doc('anon_sessions/anonA').set({ tenantId: 'tenant-B', qrKey: KEY_B }));
      await assertFails(anonA().doc('anon_sessions/anonA').delete());
    });

    it('anonim NIE może utworzyć sesji dla cudzego uid', async () => {
      await assertFails(anonA().doc('anon_sessions/someoneElse').set({ tenantId: 'tenant-A', qrKey: KEY_A }));
    });

    it('anonim firmy A czyta maszyny A, ale NIE firmy B', async () => {
      await assertSucceeds(anonA().doc('tenants/tenant-A/machines/mA').get());
      await assertFails(anonA().doc('tenants/tenant-B/machines/mB').get());
    });

    it('anonim bez sesji NIE czyta niczego (fallback legacy usunięty)', async () => {
      await assertFails(fresh().doc('tenants/tenant-A/machines/mA').get());
      await assertFails(fresh().doc('tenants/default/machines/mC').get());
    });

    it('stara sesja bez klucza (sprzed zmiany) traci dostęp', async () => {
      await testEnv.withSecurityRulesDisabled(async (ctx) => {
        await ctx.firestore().doc('anon_sessions/legacy').set({ tenantId: 'tenant-A' });
      });
      await assertFails(fresh('legacy').doc('tenants/tenant-A/machines/mA').get());
    });

    it('zmiana klucza QR przez admina unieważnia istniejące sesje', async () => {
      const admin = testEnv.authenticatedContext('adminA').firestore();
      await assertSucceeds(admin.doc('tenants/tenant-A/settings/qr_access').set({ key: 'nowy-klucz-firmy-A-0987654321' }));
      await assertFails(anonA().doc('tenants/tenant-A/machines/mA').get());
    });

    it('klucz QR: technik może utworzyć brakujący, ale NIE zmienić istniejącego', async () => {
      const tech = testEnv.authenticatedContext('techA').firestore();
      await assertSucceeds(tech.doc('tenants/tenant-A/settings/qr_access').get());
      await assertFails(tech.doc('tenants/tenant-A/settings/qr_access').set({ key: 'inny-klucz-firmy-A-1234567' }));
      await testEnv.withSecurityRulesDisabled(async (ctx) => {
        await ctx.firestore().doc('tenants/tenant-A/settings/qr_access').delete();
      });
      await assertFails(tech.doc('tenants/tenant-A/settings/qr_access').set({ key: 'zbyt-krotki' }));
      await assertSucceeds(tech.doc('tenants/tenant-A/settings/qr_access').set({ key: 'nowy-klucz-firmy-A-1234567' }));
    });

    it('pracownik innej firmy NIE czyta klucza QR firmy A', async () => {
      await testEnv.withSecurityRulesDisabled(async (ctx) => {
        await ctx.firestore().doc('users/techB').set({ tenantId: 'tenant-B', role: 'tech' });
      });
      await assertFails(testEnv.authenticatedContext('techB').firestore().doc('tenants/tenant-A/settings/qr_access').get());
    });

    it('niezalogowany nie czyta niczego', async () => {
      const un = testEnv.unauthenticatedContext().firestore();
      await assertFails(un.doc('tenants/tenant-A/machines/mA').get());
    });
  });

  // ---------- Pkt 3: biała lista pól zgłoszenia anonima ----------
  describe('Walidacja zgłoszenia anonima', () => {
    it('poprawne zgłoszenie (maszyna z listy, z poprawnym zdjęciem) przechodzi', async () => {
      const ref = anonA().collection('tenants/tenant-A/tickets').doc('t1');
      await assertSucceeds(ref.set(validTicket('anonA', { photos: [photoUrl('tenant-A', 't1')] })));
    });

    it('maszyna spoza listy: anonim tworzy "(DO WERYFIKACJI)" i zgłasza ją', async () => {
      const db = anonA();
      await assertSucceeds(db.collection('tenants/tenant-A/machines').doc('mNew').set({
        name: 'Spawarka hala 3 (DO WERYFIKACJI)', regionId: '', bay: '', currentWorkHours: 0,
        status: 'active', isDeleted: false, createdAt: new Date().toISOString(), createdBy: 'Operator', description: 'x'
      }));
      await assertSucceeds(db.collection('tenants/tenant-A/tickets').doc('t2').set(validTicket('anonA', { machineId: 'mNew' })));
    });

    it('anonim NIE tworzy maszyny bez dopisku (DO WERYFIKACJI)', async () => {
      await assertFails(anonA().collection('tenants/tenant-A/machines').doc('mX').set({ name: 'Spawarka', isDeleted: false }));
    });

    it('status inny niż "Nowe" (np. od razu zamknięte) jest odrzucany', async () => {
      await assertFails(anonA().collection('tenants/tenant-A/tickets').doc('t3').set(validTicket('anonA', { status: 5 })));
    });

    it('dodatkowe pola (przypisanie, koszty, zamknięcie) są odrzucane', async () => {
      const c = anonA().collection('tenants/tenant-A/tickets');
      await assertFails(c.doc('t4').set(validTicket('anonA', { assignedTo: 'techA' })));
      await assertFails(c.doc('t5').set(validTicket('anonA', { closedAt: 'x' })));
      await assertFails(c.doc('t6').set(validTicket('anonA', { totalCost: 0 })));
    });

    it('podszycie się pod innego zgłaszającego (reporterUid) jest odrzucane', async () => {
      await assertFails(anonA().collection('tenants/tenant-A/tickets').doc('t7').set(validTicket('kto-inny')));
    });

    it('zbyt długi opis / zdjęcie spoza katalogu zgłoszenia / >10 zdjęć – odrzucone', async () => {
      const c = anonA().collection('tenants/tenant-A/tickets');
      await assertFails(c.doc('t8').set(validTicket('anonA', { description: 'x'.repeat(5001) })));
      await assertFails(c.doc('t9').set(validTicket('anonA', { photos: ['https://evil.example.com/a.jpg'] })));
      await assertFails(c.doc('t10').set(validTicket('anonA', { photos: [photoUrl('tenant-B', 't10')] })));
      await assertFails(c.doc('t11').set(validTicket('anonA', { photos: Array.from({ length: 11 }, (_, i) => photoUrl('tenant-A', 't11', `${i}.jpg`)) })));
    });

    it('anonim firmy A NIE zgłasza awarii w firmie B', async () => {
      await assertFails(anonA().collection('tenants/tenant-B/tickets').doc('t12').set(validTicket('anonA', { machineId: 'mB' })));
    });

    it('anonim NIE czyta zgłoszeń', async () => {
      await testEnv.withSecurityRulesDisabled(async (ctx) => {
        await ctx.firestore().doc('tenants/tenant-A/tickets/tx').set(validTicket('anonA'));
      });
      await assertFails(anonA().doc('tenants/tenant-A/tickets/tx').get());
    });
  });

  describe('Synchronizacja zdjęć offline (anonim dopina zdjęcie do własnego zgłoszenia)', () => {
    beforeEach(async () => {
      await testEnv.withSecurityRulesDisabled(async (ctx) => {
        await ctx.firestore().doc('tenants/tenant-A/tickets/own').set(validTicket('anonA'));
        await ctx.firestore().doc('tenants/tenant-A/tickets/foreign').set(validTicket('kto-inny'));
      });
    });

    it('dopięcie jednego poprawnego zdjęcia do własnego zgłoszenia – OK', async () => {
      await assertSucceeds(anonA().doc('tenants/tenant-A/tickets/own').update({ photos: [photoUrl('tenant-A', 'own')] }));
    });

    it('dopięcie do cudzego zgłoszenia / zmiana statusu / obcy URL – odrzucone', async () => {
      await assertFails(anonA().doc('tenants/tenant-A/tickets/foreign').update({ photos: [photoUrl('tenant-A', 'foreign')] }));
      await assertFails(anonA().doc('tenants/tenant-A/tickets/own').update({ status: 5 }));
      await assertFails(anonA().doc('tenants/tenant-A/tickets/own').update({ photos: ['https://evil.example.com/a.jpg'] }));
    });
  });

  const describeStorage = process.env.FIREBASE_STORAGE_EMULATOR_HOST ? describe : describe.skip;
  describeStorage('Storage', () => {
    const put = (ctx, p, type) =>
      ctx.storage().ref(p).put(new Uint8Array([1, 2, 3]), { contentType: type }).then(() => true);

    it('anonim A wgrywa zdjęcie do zgłoszenia firmy A', async () => {
      await assertSucceeds(put(testEnv.authenticatedContext('anonA', ANON), 'tenants/tenant-A/tickets/t1/foto.jpg', 'image/jpeg'));
    });

    it('anonim A NIE wgrywa do firmy B', async () => {
      await assertFails(put(testEnv.authenticatedContext('anonA', ANON), 'tenants/tenant-B/tickets/t1/foto.jpg', 'image/jpeg'));
    });

    it('SVG jest blokowane', async () => {
      await assertFails(put(testEnv.authenticatedContext('anonA', ANON), 'tenants/tenant-A/tickets/t1/x.svg', 'image/svg+xml'));
    });

    it('anonim bez powiązania NIE wgrywa do firmy A', async () => {
      await assertFails(put(testEnv.authenticatedContext('unbound', ANON), 'tenants/tenant-A/tickets/t1/foto.jpg', 'image/jpeg'));
    });

    it('pracownik firmy A nadal wgrywa pliki (np. DTR) do swojej firmy', async () => {
      await assertSucceeds(put(testEnv.authenticatedContext('techA'), 'tenants/tenant-A/dtr/m1/doc.pdf', 'application/pdf'));
    });
  });
});
