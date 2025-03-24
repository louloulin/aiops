import { Hono } from 'hono';
import type { Context } from 'hono';
import { MetricsService } from '../services/metrics';
import type { SystemMetrics } from '../services/metrics';

const app = new Hono();

// Get all system metrics
app.get('/', async (c: Context) => {
  try {
    const metrics = await MetricsService.getSystemMetrics();
    return c.json(metrics);
  } catch (error) {
    console.error('Error fetching system metrics:', error);
    return c.json({ error: 'Failed to fetch system metrics' }, 500);
  }
});

// Get specific metric
app.get('/:metric', async (c: Context) => {
  try {
    const metric = c.req.param('metric');
    if (!isValidMetric(metric)) {
      return c.json({ error: `Invalid metric: ${metric}` }, 400);
    }
    const metricData = await MetricsService.getSpecificMetric(metric as keyof SystemMetrics);
    return c.json(metricData);
  } catch (error) {
    console.error(`Error fetching metric ${c.req.param('metric')}:`, error);
    return c.json({ error: `Failed to fetch metric ${c.req.param('metric')}` }, 500);
  }
});

// Get metrics analysis
app.get('/analysis', async (c: Context) => {
  try {
    const analysis = await MetricsService.analyzeMetrics();
    return c.json(analysis);
  } catch (error) {
    console.error('Error analyzing metrics:', error);
    return c.json({ error: 'Failed to analyze metrics' }, 500);
  }
});

// Helper function to validate metric names
function isValidMetric(metric: string): metric is keyof SystemMetrics {
  const validMetrics: Array<keyof SystemMetrics> = ['cpu', 'memory', 'disk', 'network'];
  return validMetrics.includes(metric as keyof SystemMetrics);
}

export const metricsRoutes = app; 