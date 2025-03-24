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

// 生成模拟日志
app.post('/generate-mock', async (c: Context) => {
  try {
    const logLevels = ['error', 'warn', 'info', 'debug'];
    const services = ['api', 'database', 'auth', 'monitoring', 'frontend'];
    const messages = [
      'Application started successfully',
      'Database connection failed',
      'High CPU usage detected',
      'User authentication successful',
      'Cache invalidated',
      'Background job completed',
      'Rate limit exceeded',
      'API request timeout',
      'Memory usage increased',
      'Scheduled task started'
    ];
    
    const mockLogs = [];
    
    // 生成10条随机日志
    for (let i = 0; i < 10; i++) {
      const level = logLevels[Math.floor(Math.random() * logLevels.length)];
      const service = services[Math.floor(Math.random() * services.length)];
      const message = messages[Math.floor(Math.random() * messages.length)];
      
      // 创建时间戳，最近24小时内的随机时间
      const timestamp = new Date(Date.now() - Math.floor(Math.random() * 24 * 60 * 60 * 1000));
      
      const mockLog = {
        level,
        message,
        service,
        timestamp: timestamp.toISOString(),
        metadata: { requestId: `req_${Math.random().toString(36).substring(2, 10)}` }
      };
      
      // 插入到数据库
      const result = await pool.query(
        'INSERT INTO logs (level, message, service, metadata, timestamp) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [level, message, service, mockLog.metadata, timestamp]
      );
      
      mockLogs.push(result.rows[0]);
    }
    
    return c.json({
      success: true,
      message: '模拟日志数据已生成并保存',
      data: mockLogs
    });
  } catch (error) {
    console.error('生成模拟日志失败:', error);
    return c.json({ 
      success: false, 
      error: '生成模拟日志失败',
      details: error instanceof Error ? error.message : String(error)
    }, 500);
  }
});

export const logsRoutes = app; 