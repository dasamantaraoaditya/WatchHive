import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema.js';
import { config } from '../config.js';
import { sql } from 'drizzle-orm';

const { Pool } = pg;
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const connectionString = config.database.url;

// For persistent container environments (Railway), we use a larger pool
const pool = new Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 30000,
    ssl: connectionString.includes('supabase.co') || connectionString.includes('supabase.com') || connectionString.includes('neon.tech')
        ? { rejectUnauthorized: false }
        : false
});

export const db = drizzle(pool, { schema });

// Helper to check DB health
export const checkDbHealth = async () => {
    try {
        await db.execute(sql`SELECT 1`);
        return true;
    } catch (error) {
        console.error('Database health check failed:', error);
        return false;
    }
};

export default db;
