// backend/src/index.ts
import cors from 'cors';
import dotenv from 'dotenv';
import express, { Request, Response } from 'express';
import swaggerUi from 'swagger-ui-express';
import { testDbConnection } from './config/db.js';
import { swaggerSpec } from './config/swagger.js';
import { authMiddleware } from './middlewares/authMiddleware.js';

dotenv.config();

export const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Run the database connection diagnostics
testDbConnection();

// Serve the interactive Swagger UI at /api-docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'Welcome to the SnapPad API!' });
});

import authRoutes from './routes/authRoutes.js';
import folderRoutes from './routes/folderRoutes.js';
import noteRoutes from './routes/noteRoutes.js';

// A simple protected check route to test your middleware
app.get('/api/protected-check', authMiddleware, (req, res) => {
  res.json({ message: 'Success!', userId: req.user?.id });
});

// Bind routes
app.use('/api/auth', authRoutes);
app.use('/api/folders', folderRoutes);
app.use('/api/notes', noteRoutes);

app.listen(PORT, () => {
  console.log(`🚀 SnapPad backend running at http://localhost:${PORT}`);
  console.log(`📑 API Documentation available at http://localhost:${PORT}/api-docs`);
});
