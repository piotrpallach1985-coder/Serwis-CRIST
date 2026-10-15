// @vitest-environment node
/**
 * Testy reguł: anonimowy operator QR może zgłaszać dowolnie, ale TYLKO w swojej firmie.
 * Wymaga emulatorów Firestore + Storage:
 *   firebase emulators:exec --only firestore,storage "npx vitest run src/components/manager/__tests__/anon-tenant-rules.test.jsx"
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
let testEnv;

describeEmu('Izolacja operatora QR (anon_sessions)', () => {
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
      await db.doc('anon_sessions/anonA').set({ tenantId: 'tenant-A' });
      await db.doc('tenants/tenant-A').set({ name: 'A' });
      await db.doc('tenants/tenant-B').set({ name: 'B' });
      await db.doc('tenants/tenant-A/machines/mA').set({ name: 'Dźwig A', isDeleted: false });
      await db.doc('tenants/tenant-B/machines/mB').set({ name: 'Dźwig B', isDeleted: false });
      await db.doc('tenants/crist/machines/mC').set({ name: 'Dźwig CRIST', isDeleted: false });
    });
  });

  const anonA = () => testEnv.authenticatedContext('anonA', ANON).firestore();

  it('anonim firmy A czyta maszyny firmy A', async () => {
    await assertSucceeds(anonA().doc('tenants/tenant-A/machines/mA').get());
  });

  it('anonim firmy A NIE czyta maszyn firmy B', async () => {
    await assertFails(anonA().doc('tenants/tenant-B/machines/mB').get());
  });

  it('anonim firmy A zgłasza awarię dowolnej maszyny A oraz maszyny spoza listy (manual)', async () => {
    await assertSucceeds(anonA().collection('tenants/tenant-A/tickets').add({ machineId: 'mA', description: 'Wyciek' }));
    await assertSucceeds(anonA().collection('tenants/tenant-A/tickets').add({ machineId: 'manual', description: 'Inna' }));
  });

  it('anonim firmy A NIE zgłasza awarii w firmie B', async () => {
    await assertFails(anonA().collection('tenants/tenant-B/tickets').add({ machineId: 'mB', description: 'x' }));
  });

  it('anonim NIE może przepiąć swojej sesji na inną firmę', async () => {
    await assertFails(anonA().doc('anon_sessions/anonA').set({ tenantId: 'tenant-B' }));
    await assertFails(anonA().doc('anon_sessions/anonA').delete());
  });

  it('anonim NIE może utworzyć sesji dla cudzego uid', async () => {
    await assertFails(anonA().doc('anon_sessions/someoneElse').set({ tenantId: 'tenant-A' }));
  });

  it('nowy anonim bez sesji NIE czyta firmy B', async () => {
    const fresh = testEnv.authenticatedContext('fresh', ANON).firestore();
    await assertFails(fresh.doc('tenants/tenant-B/machines/mB').get());
  });

  it('[legacy] anonim bez sesji czyta CRIST (zgodność wsteczna)', async () => {
    const fresh = testEnv.authenticatedContext('fresh', ANON).firestore();
    await assertSucceeds(fresh.doc('tenants/crist/machines/mC').get());
  });

  it('[ZNANE OGRANICZENIE] nowy anonim może sam zadeklarować dowolną firmę', async () => {
    // Powiązanie jest deklaratywne (identyfikator firmy z QR). Pełna weryfikacja wymaga sekretu w QR.
    const fresh = testEnv.authenticatedContext('fresh2', ANON).firestore();
    await assertSucceeds(fresh.doc('anon_sessions/fresh2').set({ tenantId: 'tenant-B' }));
  });

  it('niezalogowany nie czyta niczego', async () => {
    const un = testEnv.unauthenticatedContext().firestore();
    await assertFails(un.doc('tenants/tenant-A/machines/mA').get());
  });

  const describeStorage = process.env.FIREBASE_STORAGE_EMULATOR_HOST ? describe : describe.skip;
  describeStorage('Storage', () => {
    const put = (ctx, p, type) =>
      ctx.storage().ref(p).put(new Uint8Array([1, 2, 3]), { contentType: type }).then(() => true);

    it('anonim A wgrywa zdjęcie do zgłoszenia firmy A', async () => {
      const ctx = testEnv.authenticatedContext('anonA', ANON);
      await assertSucceeds(put(ctx, 'tenants/tenant-A/tickets/t1/foto.jpg', 'image/jpeg'));
    });

    it('anonim A NIE wgrywa do firmy B', async () => {
      const ctx = testEnv.authenticatedContext('anonA', ANON);
      await assertFails(put(ctx, 'tenants/tenant-B/tickets/t1/foto.jpg', 'image/jpeg'));
    });

    it('SVG jest blokowane', async () => {
      const ctx = testEnv.authenticatedContext('anonA', ANON);
      await assertFails(put(ctx, 'tenants/tenant-A/tickets/t1/x.svg', 'image/svg+xml'));
    });

    it('anonim bez powiązania NIE wgrywa do firmy A', async () => {
      const ctx = testEnv.authenticatedContext('unbound', ANON);
      await assertFails(put(ctx, 'tenants/tenant-A/tickets/t1/foto.jpg', 'image/jpeg'));
    });
  });
});
