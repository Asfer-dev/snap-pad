// backend/src/__tests__/folders.test.ts
import request from 'supertest';
import pool from '../config/db.js';
import { app } from '../index.js';

describe('Folder Endpoints', () => {
  let userACookies: string[];
  let userBCookies: string[];
  let userAId: string;
  let userBId: string;
  let rootFolderId: string;
  let subFolderId: string;

  beforeAll(async () => {
    // 1. Clean up tables - safely remove test data if previous runs left it
    const existingUsers = await pool.query('SELECT id FROM users WHERE email IN ($1, $2)', [
      'usera@example.com',
      'userb@example.com',
    ]);
    const existingUserIds = existingUsers.rows.map((row) => row.id);

    if (existingUserIds.length > 0) {
      // remove notes and folders that belong to these test users
      await pool.query('DELETE FROM notes WHERE user_id = ANY($1)', [existingUserIds]);
      await pool.query('DELETE FROM folders WHERE user_id = ANY($1)', [existingUserIds]);
      await pool.query('DELETE FROM users WHERE id = ANY($1)', [existingUserIds]);
    }

    // 2. Register User A and capture secure response cookies
    const registerA = await request(app).post('/api/auth/register').send({
      name: 'User A',
      email: 'usera@example.com',
      password: 'SecurePassword123',
    });
    userACookies = registerA.headers['set-cookie'] as unknown as string[]; // 🛡️ Capture authentication cookie
    userAId = registerA.body.user.id;

    // 3. Register User B and capture secure response cookies
    const registerB = await request(app).post('/api/auth/register').send({
      name: 'User B',
      email: 'userb@example.com',
      password: 'SecurePassword123',
    });
    userBCookies = registerB.headers['set-cookie'] as unknown as string[]; // 🛡️ Capture authentication cookie
    userBId = registerB.body.user.id;
  });

  afterAll(async () => {
    // Safely remove any leftover test data for these users
    const existingUsers = await pool.query('SELECT id FROM users WHERE email IN ($1, $2)', [
      'usera@example.com',
      'userb@example.com',
    ]);
    const existingUserIds = existingUsers.rows.map((row) => row.id);

    if (existingUserIds.length > 0) {
      await pool.query('DELETE FROM notes WHERE user_id = ANY($1)', [existingUserIds]);
      await pool.query('DELETE FROM folders WHERE user_id = ANY($1)', [existingUserIds]);
      await pool.query('DELETE FROM users WHERE id = ANY($1)', [existingUserIds]);
    }

    await pool.end();
  });

  describe('POST /api/folders', () => {
    it('should successfully create a root folder for User A (201)', async () => {
      const res = await request(app)
        .post('/api/folders')
        .set('Cookie', userACookies) // 🛡️ Pass secure cookie
        .send({
          name: 'Engineering Notes',
          parent_folder_id: null,
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.name).toBe('Engineering Notes');
      expect(res.body.parent_folder_id).toBeNull();
      rootFolderId = res.body.id;
    });

    it('should successfully create a nested subfolder under root folder (201)', async () => {
      const res = await request(app)
        .post('/api/folders')
        .set('Cookie', userACookies) // 🛡️ Pass secure cookie
        .send({
          name: 'Backend Architecture',
          parent_folder_id: rootFolderId,
        });

      expect(res.status).toBe(201);
      expect(res.body.parent_folder_id).toBe(rootFolderId);
      subFolderId = res.body.id;
    });

    it('should fail creation if parent_folder_id is a non-existent UUID (400)', async () => {
      const nonExistentUuid = '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcba9';

      const res = await request(app)
        .post('/api/folders')
        .set('Cookie', userACookies) // 🛡️ Pass secure cookie
        .send({
          name: 'Orphaned Subfolder',
          parent_folder_id: nonExistentUuid,
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error', 'Invalid parent folder assignment.');
    });

    it("should prevent User B from nesting a folder inside User A's folder (400)", async () => {
      const res = await request(app)
        .post('/api/folders')
        .set('Cookie', userBCookies) // 🛡️ Pass secure cookie
        .send({
          name: 'Hacked Folder',
          parent_folder_id: rootFolderId,
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('GET /api/folders', () => {
    it('should return folders owned strictly by User A (200)', async () => {
      const res = await request(app).get('/api/folders').set('Cookie', userACookies); // 🛡️ Pass secure cookie

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(2); // Root + Subfolder
    });

    it('should return an empty list for User B (200)', async () => {
      const res = await request(app).get('/api/folders').set('Cookie', userBCookies); // 🛡️ Pass secure cookie

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(0);
    });
  });

  describe('PATCH /api/folders/:id', () => {
    it('should allow User A to rename their folder (200)', async () => {
      const res = await request(app)
        .patch(`/api/folders/${rootFolderId}`)
        .set('Cookie', userACookies) // 🛡️ Pass secure cookie
        .send({
          name: 'Updated Engineering Notes',
        });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Updated Engineering Notes');
    });

    it("should prevent User B from modifying User A's folder (403/404)", async () => {
      const res = await request(app)
        .patch(`/api/folders/${rootFolderId}`)
        .set('Cookie', userBCookies) // 🛡️ Pass secure cookie
        .send({
          name: 'Malicious Rename',
        });

      expect([403, 404]).toContain(res.status);
    });
  });

  describe('DELETE /api/folders/:id', () => {
    it('should allow User A to soft delete a folder and hide it from the list (200)', async () => {
      // Delete parent folder
      const deleteRes = await request(app)
        .delete(`/api/folders/${rootFolderId}`)
        .set('Cookie', userACookies); // 🛡️ Pass secure cookie

      expect(deleteRes.status).toBe(200);

      // Verify it is hidden on standard read lookup
      const listRes = await request(app).get('/api/folders').set('Cookie', userACookies); // 🛡️ Pass secure cookie

      expect(listRes.body.length).toBe(0);
    });
  });
});
