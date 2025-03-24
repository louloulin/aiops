import { Hono } from 'hono';
import type { Context } from 'hono';
import { MetricsService } from '../services/metrics';
import type { SystemMetrics } from '../services/metrics';
import { getMetricsStats, generateMockMetrics } from '../services/metrics';
import { dbService } from '../db';
import type { SystemMetric, NewSystemMetric } from '../db/schema';

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

// 创建指标路由
const metricsRoutes = new Hono();

// 获取最新系统指标
metricsRoutes.get('/latest', async (c) => {
  try {
    // 使用Drizzle获取最新指标
    const latestMetric = await dbService.getLatestMetrics();
    
    // 如果数据库中没有数据，则生成模拟数据
    if (!latestMetric) {
      const mockMetrics = generateMockMetrics();
      
      // 转换为Drizzle格式
      const drizzleMetric: NewSystemMetric = {
        cpuUsage: mockMetrics.cpu.usage,
        cpuTemperature: mockMetrics.cpu.temperature,
        memoryTotal: mockMetrics.memory.total,
        memoryUsed: mockMetrics.memory.used,
        memoryFree: mockMetrics.memory.free,
        diskTotal: mockMetrics.disk.total,
        diskUsed: mockMetrics.disk.used,
        diskFree: mockMetrics.disk.free,
        networkBytesIn: mockMetrics.network.bytesIn,
        networkBytesOut: mockMetrics.network.bytesOut
      };
      
      // 保存到数据库
      const savedMetric = await dbService.saveMetrics(drizzleMetric);
      
      // 转换回API格式
      const apiResponse = convertToApiFormat(savedMetric);
      return c.json({ success: true, data: apiResponse });
    }
    
    // 转换为API格式
    const apiResponse = convertToApiFormat(latestMetric);
    return c.json({ success: true, data: apiResponse });
  } catch (error) {
    console.error('获取最新指标失败:', error);
    return c.json({ success: false, error: '获取最新指标失败' }, 500);
  }
});

// 获取历史指标数据
metricsRoutes.get('/history', async (c) => {
  try {
    const limit = parseInt(c.req.query('limit') || '24');
    const offset = parseInt(c.req.query('offset') || '0');
    
    // 使用Drizzle获取历史数据
    const metrics = await dbService.getHistoricalMetrics(limit, offset);
    
    // 转换为API格式
    const apiResponse = metrics.map(convertToApiFormat);
    
    return c.json({ success: true, data: apiResponse });
  } catch (error) {
    console.error('获取历史指标失败:', error);
    return c.json({ success: false, error: '获取历史指标失败' }, 500);
  }
});

// 获取指标统计数据
metricsRoutes.get('/stats', async (c) => {
  try {
    const stats = await getMetricsStats();
    return c.json({ success: true, data: stats });
  } catch (error) {
    console.error('获取指标统计失败:', error);
    return c.json({ success: false, error: '获取指标统计失败' }, 500);
  }
});

// 上传系统指标
metricsRoutes.post('/', async (c) => {
  try {
    const body = await c.req.json();
    
    if (!body || !body.cpu || !body.memory || !body.disk || !body.network) {
      return c.json({ success: false, error: '无效的指标数据格式' }, 400);
    }
    
    // 转换为Drizzle格式
    const drizzleMetric: NewSystemMetric = {
      cpuUsage: body.cpu.usage,
      cpuTemperature: body.cpu.temperature,
      memoryTotal: body.memory.total,
      memoryUsed: body.memory.used,
      memoryFree: body.memory.free,
      diskTotal: body.disk.total,
      diskUsed: body.disk.used,
      diskFree: body.disk.free,
      networkBytesIn: body.network.bytesIn,
      networkBytesOut: body.network.bytesOut
    };
    
    // 使用Drizzle保存数据
    const savedMetric = await dbService.saveMetrics(drizzleMetric);
    
    return c.json({ success: true, id: savedMetric.id });
  } catch (error) {
    console.error('保存指标失败:', error);
    return c.json({ success: false, error: '保存指标失败' }, 500);
  }
});

// 模拟生成并保存指标数据（开发/测试使用）
metricsRoutes.post('/generate-mock', async (c) => {
  try {
    const mockMetrics = generateMockMetrics();
    
    // 转换为Drizzle格式
    const drizzleMetric: NewSystemMetric = {
      cpuUsage: mockMetrics.cpu.usage,
      cpuTemperature: mockMetrics.cpu.temperature,
      memoryTotal: mockMetrics.memory.total,
      memoryUsed: mockMetrics.memory.used,
      memoryFree: mockMetrics.memory.free,
      diskTotal: mockMetrics.disk.total,
      diskUsed: mockMetrics.disk.used,
      diskFree: mockMetrics.disk.free,
      networkBytesIn: mockMetrics.network.bytesIn,
      networkBytesOut: mockMetrics.network.bytesOut
    };
    
    // 使用Drizzle保存数据
    const savedMetric = await dbService.saveMetrics(drizzleMetric);
    
    // 转换回API格式用于响应
    const apiResponse = convertToApiFormat(savedMetric);
    
    return c.json({ 
      success: true, 
      message: '模拟指标数据已生成并保存',
      id: savedMetric.id,
      data: apiResponse
    });
  } catch (error) {
    console.error('生成模拟指标失败:', error);
    return c.json({ success: false, error: '生成模拟指标失败' }, 500);
  }
});

/**
 * 将数据库格式转换为API格式
 */
function convertToApiFormat(dbMetric: SystemMetric): SystemMetrics {
  return {
    cpu: {
      usage: dbMetric.cpuUsage,
      temperature: dbMetric.cpuTemperature
    },
    memory: {
      total: dbMetric.memoryTotal,
      used: dbMetric.memoryUsed,
      free: dbMetric.memoryFree
    },
    disk: {
      total: dbMetric.diskTotal,
      used: dbMetric.diskUsed,
      free: dbMetric.diskFree
    },
    network: {
      bytesIn: dbMetric.networkBytesIn,
      bytesOut: dbMetric.networkBytesOut
    }
  };
}

export { metricsRoutes }; 