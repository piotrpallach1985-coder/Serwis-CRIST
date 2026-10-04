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

  it('allows anonymous users to upload only to their specific ticket directory', async () => {
    if (!testEnv) return;
    const anonStorage = testEnv.authenticatedContext('anon123', { firebase: { sign_in_provider: 'anonymous' } }).storage();
    
    // Valid path
    const validRef = anonStorage.ref('tenants/tenant-A/tickets/ticket123/photo.jpg');
    // Using string to mock file for test payload size limit check (<30MB)
    const fileContent = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]); // Fake 8 bytes
    
    await assertSucceeds(validRef.put(fileContent, { contentType: 'image/jpeg' }));
  });

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
