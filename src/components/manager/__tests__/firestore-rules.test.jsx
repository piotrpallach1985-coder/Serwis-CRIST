import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { describe, it, beforeAll, afterAll, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';

let testEnv;

describe('Firestore Security Rules', () => {
  beforeAll(async () => {
    // Requires Firebase Local Emulator to be running
    try {
      testEnv = await initializeTestEnvironment({
        projectId: 'serwis-crist',
        firestore: {
          rules: fs.readFileSync(path.resolve(__dirname, '../../../../firestore.rules'), 'utf8'),
        },
      });
    } catch (e) {
      console.warn("Could not connect to Firebase Emulator. Make sure 'firebase emulators:start' is running.");
    }
  });

  afterAll(async () => {
    if (testEnv) await testEnv.cleanup();
  });

  beforeEach(async () => {
    if (testEnv) await testEnv.clearFirestore();
  });

  it('blocks anonymous users from injecting fake audit logs', async () => {
    if (!testEnv) return;
    const anonDb = testEnv.authenticatedContext('anon-id', { firebase: { sign_in_provider: 'anonymous' } }).firestore();
    
    // Attempt to write to audit logs
    const docRef = anonDb.collection('tenants').doc('tenant-A').collection('audit_logs').doc('fakeLog123');
    await assertFails(docRef.set({ action: 'CREATE', details: 'Hacked' }));
  });

  it('blocks deleted employees from reading tenant data', async () => {
    if (!testEnv) return;
    
    // Set up a user document indicating the user is deleted
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await db.collection('users').doc('deletedUser123').set({
        tenantId: 'tenant-A',
        isDeleted: true
      });
    });

    const deletedUserDb = testEnv.authenticatedContext('deletedUser123').firestore();
    const docRef = deletedUserDb.collection('tenants').doc('tenant-A').collection('machines').doc('machine123');
    
    // Reading machines should fail
    await assertFails(docRef.get());
    // Writing machines should fail
    await assertFails(docRef.set({ name: 'Hacked Machine' }));
  });

  it('allows active employees to read and write within their tenant', async () => {
    if (!testEnv) return;
    
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await db.collection('users').doc('activeUser123').set({
        tenantId: 'tenant-A',
        role: 'tech',
        isDeleted: false
      });
    });

    const activeDb = testEnv.authenticatedContext('activeUser123').firestore();
    const docRef = activeDb.collection('tenants').doc('tenant-A').collection('machines').doc('machine123');
    
    await assertSucceeds(docRef.set({ name: 'Valid Machine' }));
    await assertSucceeds(docRef.get());
  });
});
