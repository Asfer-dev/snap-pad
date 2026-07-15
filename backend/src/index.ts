// backend/src/index.ts
import dotenv from 'dotenv';
import express, { Request, Response } from 'express';
import { testDbConnection } from './config/db';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable JSON middleware so Express can parse incoming request bodies
app.use(express.json());

// Run the database connection diagnostics
testDbConnection();

// A simple hello-world route
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'Welcome to the SnapPad API!' });
});

app.listen(PORT, () => {
  console.log(`🚀 SnapPad backend running at http://localhost:${PORT}`);
});
