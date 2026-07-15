// backend/src/controllers/noteController.ts
import { Request, Response } from 'express';
import { FolderRepository } from '../repositories/folderRepository.js';
import { NoteRepository } from '../repositories/noteRepository.js';

export const createNote = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, content, folder_id } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Secure context check: If folder is provided, verify it belongs to user
    if (folder_id) {
      const folder = await FolderRepository.findByIdAndUser(folder_id, userId);
      if (!folder || folder.is_deleted) {
        res.status(400).json({ error: 'Invalid folder assignment.' });
        return;
      }
    }

    const note = await NoteRepository.createNote(title, content || '', userId, folder_id || null);
    res.status(201).json(note);
  } catch (error) {
    console.error('Create Note Error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const getNotes = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { folder_id } = req.query;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Normalize folder_id query parameter
    let folderFilter: string | null | undefined = undefined;
    if (folder_id !== undefined) {
      folderFilter = folder_id === 'null' ? null : (folder_id as string);
    }

    const notes = await NoteRepository.getNotesByUser(userId, folderFilter);
    res.status(200).json(notes);
  } catch (error) {
    console.error('Get Notes Error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const getNoteById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const note = await NoteRepository.findByIdAndUser(id, userId);
    if (!note) {
      res.status(404).json({ error: 'Note not found.' });
      return;
    }

    res.status(200).json(note);
  } catch (error) {
    console.error('Get Note By ID Error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const updateNote = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { title, content, folder_id } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Verify ownership and existence
    const note = await NoteRepository.findByIdAndUser(id, userId);
    if (!note) {
      res.status(404).json({ error: 'Note not found.' });
      return;
    }

    // Verify folder assignment ownership if folder is being updated
    if (folder_id) {
      const folder = await FolderRepository.findByIdAndUser(folder_id, userId);
      if (!folder || folder.is_deleted) {
        res.status(400).json({ error: 'Invalid folder assignment.' });
        return;
      }
    }

    const updated = await NoteRepository.updateNote(id, userId, { title, content, folder_id });
    res.status(200).json(updated);
  } catch (error) {
    console.error('Update Note Error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const deleteNote = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const deleted = await NoteRepository.softDeleteNote(id, userId);
    if (!deleted) {
      res.status(404).json({ error: 'Note not found.' });
      return;
    }

    res.status(200).json({ message: 'Note moved to trash' });
  } catch (error) {
    console.error('Delete Note Error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};
