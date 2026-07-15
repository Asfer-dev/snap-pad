// backend/src/__tests__/folders.test.ts
import request from 'supertest';
import pool from '../config/db.js';
import { app } from '../index.js';

describe('Folder Endpoints', () => {
  let userAToken: string;
  let userBToken: string;
  let userAId: string;
  let userBId: string;
  let rootFolderId: string;
  let subFolderId: string;

  beforeAll(async () => {
    // 1. Clean up folders and test users
    await pool.query('DELETE FROM folders');
    await pool.query('DELETE FROM users WHERE email IN ($1, $2)', [
      'usera@example.com',
      'userb@example.com',
    ]);

    // 2. Register User A
    const registerA = await request(app).post('/api/auth/register').send({
      name: 'User A',
      email: 'usera@example.com',
      password: 'SecurePassword123',
    });
    userAToken = registerA.body.token;
    userAId = registerA.body.user.id;

    // 3. Register User B
    const registerB = await request(app).post('/api/auth/register').send({
      name: 'User B',
      email: 'userb@example.com',
      password: 'SecurePassword123',
    });
    userBToken = registerB.body.token;
    userBId = registerB.body.user.id;
  });

  afterAll(async () => {
    await pool.query('DELETE FROM folders');
    await pool.query('DELETE FROM users WHERE id IN ($1, $2)', [userAId, userBId]);
    await pool.end();
  });

  describe('POST /api/folders', () => {
    it('should successfully create a root folder for User A (201)', async () => {
      const res = await request(app)
        .post('/api/folders')
        .set('Authorization', `Bearer ${userAToken}`)
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
        .set('Authorization', `Bearer ${userAToken}`)
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
        .set('Authorization', `Bearer ${userAToken}`)
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
        .set('Authorization', `Bearer ${userBToken}`)
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
      const res = await request(app)
        .get('/api/folders')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(2); // Root + Subfolder
    });

    it('should return an empty list for User B (200)', async () => {
      const res = await request(app)
        .get('/api/folders')
        .set('Authorization', `Bearer ${userBToken}`);

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(0);
    });
  });

  describe('PATCH /api/folders/:id', () => {
    it('should allow User A to rename their folder (200)', async () => {
      const res = await request(app)
        .patch(`/api/folders/${rootFolderId}`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          name: 'Updated Engineering Notes',
        });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Updated Engineering Notes');
    });

    it("should prevent User B from modifying User A's folder (403/404)", async () => {
      const res = await request(app)
        .patch(`/api/folders/${rootFolderId}`)
        .set('Authorization', `Bearer ${userBToken}`)
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
        .set('Authorization', `Bearer ${userAToken}`);

      expect(deleteRes.status).toBe(200);

      // Verify it is hidden on standard read lookup
      const listRes = await request(app)
        .get('/api/folders')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(listRes.body.length).toBe(0);
    });
  });
});
