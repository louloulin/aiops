import { Hono } from 'hono';
import type { Context } from 'hono';
import { z } from 'zod';
import { pool } from '../config/database';

const app = new Hono();

// Get all deployments with optional filtering
app.get('/', async (c: Context) => {
  try {
    const environment = c.req.query('environment');
    const status = c.req.query('status');
    const limit = Number(c.req.query('limit')) || 10;

    let query = 'SELECT * FROM deployments';
    const params: any[] = [];
    let paramIndex = 1;

    if (environment || status) {
      query += ' WHERE';
      if (environment) {
        query += ` environment = $${paramIndex}`;
        params.push(environment);
        paramIndex++;
      }
      if (status) {
        if (environment) query += ' AND';
        query += ` status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      }
    }

    query += ' ORDER BY created_at DESC LIMIT $' + paramIndex;
    params.push(limit);

    const result = await pool.query(query, params);
    return c.json(result.rows);
  } catch (error) {
    console.error('Error fetching deployments:', error);
    return c.json({ error: 'Failed to fetch deployments' }, 500);
  }
});

// Create new deployment
app.post('/', async (c: Context) => {
  try {
    const body = await c.req.json();
    const deploySchema = z.object({
      name: z.string(),
      environment: z.enum(['development', 'staging', 'production']),
      version: z.string(),
      metadata: z.record(z.any()).optional(),
    });

    const validatedData = deploySchema.parse(body);
    const { name, environment, version, metadata } = validatedData;

    const result = await pool.query(
      'INSERT INTO deployments (name, environment, version, status, metadata) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, environment, version, 'pending', metadata]
    );

    // TODO: Trigger actual deployment process
    // This would typically be handled by a background job

    return c.json(result.rows[0], 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Invalid deployment data', details: error.errors }, 400);
    }
    console.error('Error creating deployment:', error);
    return c.json({ error: 'Failed to create deployment' }, 500);
  }
});

// Get deployment status
app.get('/:id', async (c: Context) => {
  try {
    const id = c.req.param('id');
    const result = await pool.query('SELECT * FROM deployments WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return c.json({ error: 'Deployment not found' }, 404);
    }

    return c.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching deployment:', error);
    return c.json({ error: 'Failed to fetch deployment' }, 500);
  }
});

// Update deployment status
app.patch('/:id/status', async (c: Context) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const statusSchema = z.object({
      status: z.enum(['pending', 'in_progress', 'completed', 'failed']),
    });

    const { status } = statusSchema.parse(body);

    const result = await pool.query(
      'UPDATE deployments SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, id]
    );

    if (result.rows.length === 0) {
      return c.json({ error: 'Deployment not found' }, 404);
    }

    return c.json(result.rows[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Invalid status', details: error.errors }, 400);
    }
    console.error('Error updating deployment status:', error);
    return c.json({ error: 'Failed to update deployment status' }, 500);
  }
});

// Rollback deployment
app.post('/:id/rollback', async (c: Context) => {
  try {
    const id = c.req.param('id');
    const deployment = await pool.query('SELECT * FROM deployments WHERE id = $1', [id]);

    if (deployment.rows.length === 0) {
      return c.json({ error: 'Deployment not found' }, 404);
    }

    // Create rollback deployment
    const originalDeployment = deployment.rows[0];
    const result = await pool.query(
      'INSERT INTO deployments (name, environment, version, status, metadata) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [
        `${originalDeployment.name}-rollback`,
        originalDeployment.environment,
        originalDeployment.version,
        'pending',
        { ...originalDeployment.metadata, rollback_from: id },
      ]
    );

    // TODO: Trigger actual rollback process
    // This would typically be handled by a background job

    return c.json(result.rows[0], 201);
  } catch (error) {
    console.error('Error creating rollback:', error);
    return c.json({ error: 'Failed to create rollback' }, 500);
  }
});

export const deployRoutes = app; 