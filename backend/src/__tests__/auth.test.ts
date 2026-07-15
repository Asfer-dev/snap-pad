// backend/src/__tests__/auth.test.ts
import request from 'supertest';
import pool from '../config/db.js';
import { app } from '../index.js'; // Ensure your Express app is exported from this file

describe('Auth Endpoints', () => {
  // Clean up the database before running tests
  beforeAll(async () => {
    await pool.query('DELETE FROM users WHERE email IN ($1, $2)', [
      'testuser@example.com',
      'duplicate@example.com',
    ]);
  });

  // Close the database pool after tests finish so Jest can exit cleanly
  afterAll(async () => {
    await pool.end();
  });

  describe('POST /api/auth/register', () => {
    it('should successfully register a new user and return a token (201)', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Test User',
        email: 'testuser@example.com',
        password: 'SecurePassword123',
      });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user).toHaveProperty('id');
      expect(res.body.user.name).toBe('Test User');
      expect(res.body.user.email).toBe('testuser@example.com');
      expect(res.body.user).not.toHaveProperty('password_hash');
    });

    it('should fail registration if email format is invalid (400)', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Bad Email',
        email: 'invalid-email-format',
        password: 'SecurePassword123',
      });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('should fail registration if password is under 8 characters (400)', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Short Password',
        email: 'shortpass@example.com',
        password: '123',
      });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('should fail registration if email is already registered (400)', async () => {
      // First, create the user
      await request(app).post('/api/auth/register').send({
        name: 'Duplicate User',
        email: 'duplicate@example.com',
        password: 'SecurePassword123',
      });

      // Try creating them again
      const res = await request(app).post('/api/auth/register').send({
        name: 'Duplicate User',
        email: 'duplicate@example.com',
        password: 'SecurePassword123',
      });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error', 'Email already registered.');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should successfully login and return a token (200)', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'testuser@example.com',
        password: 'SecurePassword123',
      });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.email).toBe('testuser@example.com');
    });

    it('should fail login with incorrect password (401)', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'testuser@example.com',
        password: 'WrongPassword',
      });

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error', 'Invalid email or password.');
    });
  });

  describe('GET /api/protected-check (Middleware Check)', () => {
    it('should deny access without a token (401)', async () => {
      const res = await request(app).get('/api/protected-check');
      expect(res.status).toBe(401);
    });

    it('should allow access with a valid token (200)', async () => {
      // Get a fresh token by logging in
      const loginRes = await request(app).post('/api/auth/login').send({
        email: 'testuser@example.com',
        password: 'SecurePassword123',
      });

      const token = loginRes.body.token;

      const res = await request(app)
        .get('/api/protected-check')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('userId');
    });
  });
});
