// backend/src/repositories/folderRepository.ts
import pool from '../config/db.js';

export interface FolderRow {
  id: string;
  name: string;
  user_id: string;
  parent_folder_id: string | null;
  is_deleted: boolean;
  created_at: Date;
  updated_at: Date;
}

export const FolderRepository = {
  async findById(id: string): Promise<FolderRow | null> {
    const result = await pool.query('SELECT * FROM folders WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  async findByIdAndUser(id: string, userId: string): Promise<FolderRow | null> {
    const result = await pool.query('SELECT * FROM folders WHERE id = $1 AND user_id = $2', [
      id,
      userId,
    ]);
    return result.rows[0] || null;
  },

  async createFolder(
    name: string,
    userId: string,
    parentFolderId: string | null,
  ): Promise<FolderRow> {
    const result = await pool.query(
      `INSERT INTO folders (name, user_id, parent_folder_id)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [name, userId, parentFolderId],
    );
    return result.rows[0];
  },

  async getFoldersByUser(userId: string, includeDeleted = false): Promise<FolderRow[]> {
    let query = 'SELECT * FROM folders WHERE user_id = $1';
    const params: any[] = [userId];

    if (!includeDeleted) {
      // Highly performant way to filter out any folders that are deleted OR have any ancestor deleted
      query = `
        WITH RECURSIVE folder_tree AS (
          SELECT id, name, parent_folder_id, is_deleted
          FROM folders
          WHERE user_id = $1 AND parent_folder_id IS NULL AND is_deleted = false
          
          UNION ALL
          
          SELECT f.id, f.name, f.parent_folder_id, f.is_deleted
          FROM folders f
          INNER JOIN folder_tree ft ON f.parent_folder_id = ft.id
          WHERE f.is_deleted = false
        )
        SELECT * FROM folder_tree;
      `;
    }

    const result = await pool.query(query, params);
    return result.rows;
  },

  async updateFolder(
    id: string,
    userId: string,
    name: string,
    parentFolderId: string | null,
  ): Promise<FolderRow | null> {
    const result = await pool.query(
      `UPDATE folders
       SET name = COALESCE($1, name),
           parent_folder_id = CASE WHEN $2 = 'undefined' THEN parent_folder_id ELSE $3 END,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4 AND user_id = $5
       RETURNING *`,
      [name, parentFolderId === undefined ? 'undefined' : 'defined', parentFolderId, id, userId],
    );
    return result.rows[0] || null;
  },

  async softDeleteFolder(id: string, userId: string): Promise<boolean> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Recursively find and soft-delete the folder and all its subfolders
      const folderResult = await client.query(
        `WITH RECURSIVE descendants AS (
           SELECT id FROM folders WHERE id = $1 AND user_id = $2
           UNION ALL
           SELECT f.id FROM folders f
           INNER JOIN descendants d ON f.parent_folder_id = d.id
         )
         UPDATE folders
         SET is_deleted = true, updated_at = CURRENT_TIMESTAMP
         WHERE id IN (SELECT id FROM descendants)
         RETURNING id`,
        [id, userId],
      );

      const deletedFolderIds = folderResult.rows.map((row) => row.id);

      if (deletedFolderIds.length > 0) {
        // 2. Soft-delete all notes belonging to any of these recursively deleted folders
        await client.query(
          `UPDATE notes
           SET is_deleted = true, updated_at = CURRENT_TIMESTAMP
           WHERE folder_id = ANY($1) AND user_id = $2`,
          [deletedFolderIds, userId],
        );
      }

      await client.query('COMMIT');
      return deletedFolderIds.length > 0;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Transaction rollback failed in softDeleteFolder:', error);
      throw error;
    } finally {
      client.release();
    }
  },
};
