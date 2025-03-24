import { Hono } from 'hono';
import type { Context } from 'hono';
import { z } from 'zod';
import { pool } from '../config/database';

const app = new Hono();

// Get all healing rules
app.get('/rules', async (c: Context) => {
  try {
    const result = await pool.query('SELECT * FROM healing_rules ORDER BY created_at DESC');
    return c.json(result.rows);
  } catch (error) {
    console.error('Error fetching healing rules:', error);
    return c.json({ error: 'Failed to fetch healing rules' }, 500);
  }
});

// Create new healing rule
app.post('/rules', async (c: Context) => {
  try {
    const body = await c.req.json();
    const ruleSchema = z.object({
      condition: z.string(),
      action: z.string(),
      threshold: z.number().optional(),
      description: z.string().optional(),
      metadata: z.record(z.any()).optional(),
    });

    const validatedData = ruleSchema.parse(body);
    const { condition, action, threshold, description, metadata } = validatedData;

    const result = await pool.query(
      'INSERT INTO healing_rules (condition, action, threshold, description, metadata) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [condition, action, threshold, description, metadata]
    );

    return c.json(result.rows[0], 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Invalid healing rule data', details: error.errors }, 400);
    }
    console.error('Error creating healing rule:', error);
    return c.json({ error: 'Failed to create healing rule' }, 500);
  }
});

// Get all incidents
app.get('/incidents', async (c: Context) => {
  try {
    const status = c.req.query('status');
    const service = c.req.query('service');
    const limit = Number(c.req.query('limit')) || 10;

    let query = 'SELECT * FROM incidents';
    const params: any[] = [];
    let paramIndex = 1;

    if (status || service) {
      query += ' WHERE';
      if (status) {
        query += ` status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      }
      if (service) {
        if (status) query += ' AND';
        query += ` service = $${paramIndex}`;
        params.push(service);
        paramIndex++;
      }
    }

    query += ' ORDER BY created_at DESC LIMIT $' + paramIndex;
    params.push(limit);

    const result = await pool.query(query, params);
    return c.json(result.rows);
  } catch (error) {
    console.error('Error fetching incidents:', error);
    return c.json({ error: 'Failed to fetch incidents' }, 500);
  }
});

// Create new incident
app.post('/incidents', async (c: Context) => {
  try {
    const body = await c.req.json();
    const incidentSchema = z.object({
      title: z.string(),
      service: z.string(),
      severity: z.enum(['low', 'medium', 'high', 'critical']),
      metadata: z.record(z.any()).optional(),
    });

    const validatedData = incidentSchema.parse(body);
    const { title, service, severity, metadata } = validatedData;

    const result = await pool.query(
      'INSERT INTO incidents (title, service, severity, status, metadata) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [title, service, severity, 'open', metadata]
    );

    // TODO: Trigger auto-healing process based on matching rules
    // This would typically be handled by a background job

    return c.json(result.rows[0], 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Invalid incident data', details: error.errors }, 400);
    }
    console.error('Error creating incident:', error);
    return c.json({ error: 'Failed to create incident' }, 500);
  }
});

// Update incident status
app.patch('/incidents/:id/status', async (c: Context) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const statusSchema = z.object({
      status: z.enum(['open', 'investigating', 'resolved', 'closed']),
    });

    const { status } = statusSchema.parse(body);

    const result = await pool.query(
      'UPDATE incidents SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, id]
    );

    if (result.rows.length === 0) {
      return c.json({ error: 'Incident not found' }, 404);
    }

    return c.json(result.rows[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Invalid status', details: error.errors }, 400);
    }
    console.error('Error updating incident status:', error);
    return c.json({ error: 'Failed to update incident status' }, 500);
  }
});

// Get healing history for an incident
app.get('/incidents/:id/healing', async (c: Context) => {
  try {
    const id = c.req.param('id');
    const result = await pool.query(
      `SELECT h.*, r.condition, r.action 
       FROM healing_history h 
       LEFT JOIN healing_rules r ON h.rule_id = r.id 
       WHERE h.incident_id = $1 
       ORDER BY h.created_at DESC`,
      [id]
    );

    return c.json(result.rows);
  } catch (error) {
    console.error('Error fetching healing history:', error);
    return c.json({ error: 'Failed to fetch healing history' }, 500);
  }
});

export const autohealRoutes = app; 