// backend/src/routes/noteRoutes.ts
import { Router } from 'express';
import {
  createNote,
  deleteNote,
  getNoteById,
  getNotes,
  updateNote,
} from '../controllers/noteController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();

// Secure entire routing segment
router.use(authMiddleware);

router.post('/', createNote);
router.get('/', getNotes);
router.get('/:id', getNoteById);
router.put('/:id', updateNote);
router.delete('/:id', deleteNote);

export default router;
