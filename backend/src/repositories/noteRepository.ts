// backend/src/repositories/noteRepository.ts
import pool from '../config/db.js';

export interface NoteRow {
  id: string;
  title: string;
  content: string;
  user_id: string;
  folder_id: string | null;
  is_deleted: boolean;
  created_at: Date;
  updated_at: Date;
}

export const NoteRepository = {
  async findByIdAndUser(id: string, userId: string): Promise<NoteRow | null> {
    const result = await pool.query(
      'SELECT * FROM notes WHERE id = $1 AND user_id = $2 AND is_deleted = false',
      [id, userId],
    );
    return result.rows[0] || null;
  },

  async createNote(
    title: string | undefined,
    content: string,
    userId: string,
    folderId: string | null,
  ): Promise<NoteRow> {
    const finalTitle = title && title.trim() !== '' ? title : 'Untitled Note';
    const result = await pool.query(
      `INSERT INTO notes (title, content, user_id, folder_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [finalTitle, content, userId, folderId],
    );
    return result.rows[0];
  },

  async getNotesByUser(userId: string, folderId?: string | null): Promise<NoteRow[]> {
    let query = 'SELECT * FROM notes WHERE user_id = $1 AND is_deleted = false';
    const params: any[] = [userId];

    if (folderId !== undefined) {
      query += ' AND folder_id = $2';
      params.push(folderId);
    }

    const result = await pool.query(query, params);
    return result.rows;
  },

  async updateNote(
    id: string,
    userId: string,
    updates: { title?: string; content?: string; folder_id?: string | null },
  ): Promise<NoteRow | null> {
    const { title, content, folder_id } = updates;
    const result = await pool.query(
      `UPDATE notes
       SET title = COALESCE($1, title),
           content = COALESCE($2, content),
           folder_id = CASE WHEN $3 = 'undefined' THEN folder_id ELSE $4 END,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5 AND user_id = $6 AND is_deleted = false
       RETURNING *`,
      [title, content, folder_id === undefined ? 'undefined' : 'defined', folder_id, id, userId],
    );
    return result.rows[0] || null;
  },

  async softDeleteNote(id: string, userId: string): Promise<boolean> {
    const result = await pool.query(
      `UPDATE notes
       SET is_deleted = true, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND user_id = $2 AND is_deleted = false`,
      [id, userId],
    );
    return (result.rowCount ?? 0) > 0;
  },
};
