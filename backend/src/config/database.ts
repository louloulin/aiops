import { Pool } from 'pg';
import { PgVector } from '@mastra/pg';

// Create PostgreSQL connection pool
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Create PgVector instance for vector storage
export const pgVector = new PgVector(process.env.DATABASE_URL || '');

// Initialize database
export async function initializeDatabase() {
  try {
    // Create knowledge_embeddings table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS knowledge_embeddings (
        id SERIAL PRIMARY KEY,
        content TEXT NOT NULL,
        embedding vector(1536),
        metadata JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create metrics table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS metrics (
        id SERIAL PRIMARY KEY,
        service_name TEXT,
        metric_name TEXT NOT NULL,
        value DOUBLE PRECISION NOT NULL,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create logs table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS logs (
        id SERIAL PRIMARY KEY,
        level TEXT NOT NULL,
        message TEXT NOT NULL,
        service TEXT,
        metadata JSONB,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create deployments table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS deployments (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        environment TEXT NOT NULL,
        version TEXT NOT NULL,
        status TEXT NOT NULL,
        metadata JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create incidents table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS incidents (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        service TEXT NOT NULL,
        severity TEXT NOT NULL,
        status TEXT NOT NULL,
        metadata JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create healing_rules table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS healing_rules (
        id SERIAL PRIMARY KEY,
        condition TEXT NOT NULL,
        action TEXT NOT NULL,
        threshold DOUBLE PRECISION,
        description TEXT,
        metadata JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create healing_history table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS healing_history (
        id SERIAL PRIMARY KEY,
        incident_id INTEGER REFERENCES incidents(id),
        rule_id INTEGER REFERENCES healing_rules(id),
        action_taken TEXT NOT NULL,
        result TEXT NOT NULL,
        metadata JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
} 