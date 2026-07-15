// backend/src/config/db.ts
import dotenv from 'dotenv';
import pg from 'pg';

// Ensure environment variables are loaded
dotenv.config();

const { Pool } = pg;

// Initialize the connection pool using our environment variable
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

/**
 * Helper function to test the database connection pool on startup
 */
export const testDbConnection = async (): Promise<void> => {
  try {
    // Acquire a temporary client from the pool to run a fast diagnostic query
    const client = await pool.connect();
    console.log('🔌 Database pool connected successfully!');

    const res = await client.query('SELECT NOW()');
    console.log(`🕒 Database Server Time: ${res.rows[0].now}`);

    // Release the client back to the pool immediately
    client.release();
  } catch (error) {
    console.error('❌ Database connection failed!', error);
    process.exit(1); // Kill the server if we can't connect to our database
  }
};

// Export the pool instance so we can run queries from other files
export default pool;
