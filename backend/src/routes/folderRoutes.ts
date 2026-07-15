// backend/src/routes/folderRoutes.ts
import { Router } from 'express';
import {
  createFolder,
  deleteFolder,
  getFolders,
  updateFolder,
} from '../controllers/folderController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();

// Secure all endpoints using the authentication middleware
router.use(authMiddleware);

router.post('/', createFolder);
router.get('/', getFolders);
router.patch('/:id', updateFolder);
router.delete('/:id', deleteFolder);

export default router;
