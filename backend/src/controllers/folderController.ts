// backend/src/controllers/folderController.ts
import { Request, Response } from 'express';
import { FolderRepository } from '../repositories/folderRepository.js';

export const createFolder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, parent_folder_id } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (!name || name.trim() === '') {
      res.status(400).json({ error: 'Folder name is required.' });
      return;
    }

    // Verify parent folder belongs to the user if provided
    if (parent_folder_id) {
      const parent = await FolderRepository.findByIdAndUser(parent_folder_id, userId);
      if (!parent || parent.is_deleted) {
        res.status(400).json({ error: 'Invalid parent folder assignment.' });
        return;
      }
    }

    const folder = await FolderRepository.createFolder(name, userId, parent_folder_id || null);
    res.status(201).json(folder);
  } catch (error) {
    console.error('Create Folder Error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const getFolders = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const includeDeleted = req.query.includeDeleted === 'true';

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const folders = await FolderRepository.getFoldersByUser(userId, includeDeleted);
    res.status(200).json(folders);
  } catch (error) {
    console.error('Get Folders Error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const updateFolder = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { name, parent_folder_id } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // 1. Verify existence and ownership
    const folder = await FolderRepository.findByIdAndUser(id, userId);
    if (!folder) {
      res.status(404).json({ error: 'Folder not found.' });
      return;
    }

    // 2. Prevent circular reference (nesting a folder inside itself)
    if (parent_folder_id === id) {
      res.status(400).json({ error: 'A folder cannot be its own parent.' });
      return;
    }

    // 3. Verify target parent folder owner
    if (parent_folder_id) {
      const parent = await FolderRepository.findByIdAndUser(parent_folder_id, userId);
      if (!parent) {
        res.status(400).json({ error: 'Invalid parent folder assignment.' });
        return;
      }
    }

    const updated = await FolderRepository.updateFolder(id, userId, name, parent_folder_id);
    res.status(200).json(updated);
  } catch (error) {
    console.error('Update Folder Error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const deleteFolder = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const exists = await FolderRepository.findByIdAndUser(id, userId);
    if (!exists) {
      res.status(404).json({ error: 'Folder not found.' });
      return;
    }

    await FolderRepository.softDeleteFolder(id, userId);
    res.status(200).json({ message: 'Folder and its contents soft-deleted successfully' });
  } catch (error) {
    console.error('Delete Folder Error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};
