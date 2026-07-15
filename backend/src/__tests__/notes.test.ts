// backend/src/__tests__/notes.test.ts
import request from 'supertest';
import pool from '../config/db.js';
import { app } from '../index.js';

describe('Notes Endpoints', () => {
  let userAToken: string;
  let userBToken: string;
  let userAId: string;
  let userBId: string;
  let folderId: string;
  let noteId: string;

  beforeAll(async () => {
    // 1. Clean up tables
    // 1. Find and store the test users if they already exist from previous crashed runs
    const existingUsers = await pool.query('SELECT id FROM users WHERE email IN ($1, $2)', [
      'note_usera@example.com',
      'note_userb@example.com',
    ]);
    const existingUserIds = existingUsers.rows.map((row) => row.id);

    if (existingUserIds.length > 0) {
      // 2. Safely delete only the notes belonging to these specific test users
      await pool.query('DELETE FROM notes WHERE user_id = ANY($1)', [existingUserIds]);

      // 3. Safely delete only the folders belonging to these specific test users
      await pool.query('DELETE FROM folders WHERE user_id = ANY($1)', [existingUserIds]);

      // 4. Safely delete the test users themselves
      await pool.query('DELETE FROM users WHERE id = ANY($1)', [existingUserIds]);
    }

    // 2. Setup User A
    const registerA = await request(app).post('/api/auth/register').send({
      name: 'User A',
      email: 'note_usera@example.com',
      password: 'SecurePassword123',
    });
    userAToken = registerA.body.token;
    userAId = registerA.body.user.id;

    // 3. Setup User B
    const registerB = await request(app).post('/api/auth/register').send({
      name: 'User B',
      email: 'note_userb@example.com',
      password: 'SecurePassword123',
    });
    userBToken = registerB.body.token;
    userBId = registerB.body.user.id;

    // 4. Create a folder for User A
    const folderRes = await request(app)
      .post('/api/folders')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ name: 'Personal Notes' });
    folderId = folderRes.body.id;
  });

  afterAll(async () => {
    // 1. Find and store the test users if they already exist from previous crashed runs
    const existingUsers = await pool.query('SELECT id FROM users WHERE email IN ($1, $2)', [
      'note_usera@example.com',
      'note_userb@example.com',
    ]);
    const existingUserIds = existingUsers.rows.map((row) => row.id);

    if (existingUserIds.length > 0) {
      // 2. Safely delete only the notes belonging to these specific test users
      await pool.query('DELETE FROM notes WHERE user_id = ANY($1)', [existingUserIds]);

      // 3. Safely delete only the folders belonging to these specific test users
      await pool.query('DELETE FROM folders WHERE user_id = ANY($1)', [existingUserIds]);

      // 4. Safely delete the test users themselves
      await pool.query('DELETE FROM users WHERE id = ANY($1)', [existingUserIds]);
    }
    await pool.end();
  });

  describe('POST /api/notes', () => {
    it('should successfully create a markdown note with an optional title (201)', async () => {
      const res = await request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          title: 'My First Note',
          content: '# Header\nThis is a [link](https://google.com)',
          folder_id: folderId,
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.title).toBe('My First Note');
      expect(res.body.content).toContain('[link]');
      expect(res.body.folder_id).toBe(folderId);
      noteId = res.body.id;
    });

    it('should default title to "Untitled Note" if left empty (201)', async () => {
      const res = await request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          content: 'No title provided here.',
        });

      expect(res.status).toBe(201);
      expect(res.body.title).toBe('Untitled Note');
    });

    it("should prevent creating a note in another user's folder (403/400)", async () => {
      const res = await request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${userBToken}`)
        .send({
          title: 'Intruder Note',
          content: 'Trying to sneak into User A folder',
          folder_id: folderId,
        });

      expect([400, 403]).toContain(res.status);
    });
  });

  describe('GET /api/notes', () => {
    it('should list all active notes for the authenticated user (200)', async () => {
      const res = await request(app).get('/api/notes').set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(2);
    });

    it('should return empty list for user without notes (200)', async () => {
      const res = await request(app).get('/api/notes').set('Authorization', `Bearer ${userBToken}`);

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(0);
    });
  });

  describe('PUT /api/notes/:id', () => {
    it('should allow user to update note details (200)', async () => {
      const res = await request(app)
        .put(`/api/notes/${noteId}`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          title: 'Updated Title',
          content: 'Updated Content',
        });

      expect(res.status).toBe(200);
      expect(res.body.title).toBe('Updated Title');
      expect(res.body.content).toBe('Updated Content');
    });

    it("should prevent editing another user's note (404/403)", async () => {
      const res = await request(app)
        .put(`/api/notes/${noteId}`)
        .set('Authorization', `Bearer ${userBToken}`)
        .send({
          title: 'Hacked Title',
          content: 'Hacked Content',
        });

      expect([403, 404]).toContain(res.status);
    });
  });

  describe('Cascade Folder Deletion Test', () => {
    it('should automatically soft delete nested notes when parent folder is soft deleted (200)', async () => {
      // 1. Delete parent folder
      const folderDelRes = await request(app)
        .delete(`/api/folders/${folderId}`)
        .set('Authorization', `Bearer ${userAToken}`);

      expect(folderDelRes.status).toBe(200);

      // 2. Fetch the note and assert it is now hidden/soft-deleted
      const noteGetRes = await request(app)
        .get(`/api/notes/${noteId}`)
        .set('Authorization', `Bearer ${userAToken}`);

      expect(noteGetRes.status).toBe(404);
    });
  });
});
