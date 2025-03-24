import { Hono } from 'hono';
import type { Context } from 'hono';
import { z } from 'zod';
import { pool } from '../config/database';

const app = new Hono();

// Get logs with optional filtering
app.get('/', async (c: Context) => {
  try {
    const level = c.req.query('level');
    const service = c.req.query('service');
    const limit = Number(c.req.query('limit')) || 100;

    let query = 'SELECT * FROM logs';
    const params: any[] = [];
    let paramIndex = 1;

    if (level || service) {
      query += ' WHERE';
      if (level) {
        query += ` level = $${paramIndex}`;
        params.push(level);
        paramIndex++;
      }
      if (service) {
        if (level) query += ' AND';
        query += ` service = $${paramIndex}`;
        params.push(service);
        paramIndex++;
      }
    }

    query += ' ORDER BY timestamp DESC LIMIT $' + paramIndex;
    params.push(limit);

    const result = await pool.query(query, params);
    return c.json(result.rows);
  } catch (error) {
    console.error('Error fetching logs:', error);
    return c.json({ error: 'Failed to fetch logs' }, 500);
  }
});

// Create new log entry
app.post('/', async (c: Context) => {
  try {
    const body = await c.req.json();
    const logSchema = z.object({
      level: z.enum(['error', 'warn', 'info', 'debug']),
      message: z.string(),
      service: z.string().optional(),
      metadata: z.record(z.any()).optional(),
    });

    const validatedData = logSchema.parse(body);
    const { level, message, service, metadata } = validatedData;

    const result = await pool.query(
      'INSERT INTO logs (level, message, service, metadata) VALUES ($1, $2, $3, $4) RETURNING *',
      [level, message, service, metadata]
    );

    return c.json(result.rows[0], 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Invalid log data', details: error.errors }, 400);
    }
    console.error('Error creating log:', error);
    return c.json({ error: 'Failed to create log' }, 500);
  }
});

// Get log analysis
app.get('/analysis', async (c: Context) => {
  try {
    const timeRange = c.req.query('timeRange') || '24h';
    const service = c.req.query('service');

    let query = `
      SELECT 
        level,
        COUNT(*) as count,
        MIN(timestamp) as first_occurrence,
        MAX(timestamp) as last_occurrence
      FROM logs
      WHERE timestamp >= NOW() - INTERVAL '1 ${timeRange}'
    `;

    const params: any[] = [];
    if (service) {
      query += ' AND service = $1';
      params.push(service);
    }

    query += ' GROUP BY level ORDER BY count DESC';

    const result = await pool.query(query, params);
    return c.json(result.rows);
  } catch (error) {
    console.error('Error analyzing logs:', error);
    return c.json({ error: 'Failed to analyze logs' }, 500);
  }
});

export const logsRoutes = app; 