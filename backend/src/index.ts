// backend/src/index.ts
import cors from 'cors';
import dotenv from 'dotenv';
import express, { Request, Response } from 'express';
import swaggerUi from 'swagger-ui-express';
import { testDbConnection } from './config/db.js';
import { swaggerSpec } from './config/swagger.js';

dotenv.config();

const app = express();
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

app.listen(PORT, () => {
  console.log(`🚀 SnapPad backend running at http://localhost:${PORT}`);
  console.log(`📑 API Documentation available at http://localhost:${PORT}/api-docs`);
});
