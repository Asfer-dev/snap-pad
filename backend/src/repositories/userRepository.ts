import pool from '../config/db.js';

export interface UserRow {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  created_at: Date;
  updated_at: Date;
}

export const UserRepository = {
  async findByEmail(email: string): Promise<UserRow | null> {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    return result.rows[0] || null;
  },

  async findById(id: string): Promise<Omit<UserRow, 'password_hash'> | null> {
    const result = await pool.query(
      'SELECT id, name, email, created_at, updated_at FROM users WHERE id = $1',
      [id],
    );
    return result.rows[0] || null;
  },

  async createUser(
    name: string,
    email: string,
    passwordHash: string,
  ): Promise<Omit<UserRow, 'password_hash'>> {
    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash) 
       VALUES ($1, $2, $3) 
       RETURNING id, name, email, created_at, updated_at`,
      [name, email.toLowerCase(), passwordHash],
    );
    return result.rows[0];
  },
};
