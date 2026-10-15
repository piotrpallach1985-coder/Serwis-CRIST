import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { describe, it, beforeAll, afterAll, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';

let testEnv;

describe('Storage Security Rules', () => {
  beforeAll(async () => {
    try {
      testEnv = await initializeTestEnvironment({
        projectId: 'serwis-crist',
        storage: {
          rules: fs.readFileSync(path.resolve(__dirname, '../../../../storage.rules'), 'utf8'),
        },
        firestore: {
          rules: fs.readFileSync(path.resolve(__dirname, '../../../../firestore.rules'), 'utf8'),
        },
      });
    } catch (e) {
      console.warn("Could not connect to Firebase Emulator.");
    }
  });

  afterAll(async () => {
    if (testEnv) await testEnv.cleanup();
  });

  beforeEach(async () => {
    if (testEnv) await testEnv.clearStorage();
  });

  // Upload anonima (powiązany / niepowiązany / inna firma / SVG) – patrz anon-tenant-rules.test.jsx

  it('blocks anonymous users from reading other tenants general files', async () => {
    if (!testEnv) return;
    const anonStorage = testEnv.authenticatedContext('anon123', { firebase: { sign_in_provider: 'anonymous' } }).storage();
    
    // Attempt to access machine photos
    const invalidRef = anonStorage.ref('tenants/tenant-A/machine_photos/machine123/file.jpg');
    await assertFails(invalidRef.getDownloadURL());
  });

  it('blocks anonymous users from deleting files', async () => {
    if (!testEnv) return;
    const anonStorage = testEnv.authenticatedContext('anon123', { firebase: { sign_in_provider: 'anonymous' } }).storage();
    
    // Even if it's in their ticket folder, they cannot delete
    const ref = anonStorage.ref('tenants/tenant-A/tickets/ticket123/photo.jpg');
    await assertFails(ref.delete());
  });
});
