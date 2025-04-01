import { Hono } from 'hono';
import type { Context } from 'hono';
import { MetricsService } from '../services/metrics';
import type { SystemMetrics } from '../services/metrics';
import { getMetricsStats, generateMockMetrics } from '../services/metrics';
import { dbService } from '../db';
import type { SystemMetric, NewSystemMetric } from '../db/schema';
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { monitoringTools } from "../agents/monitoringAgent";
import { db } from '../db/drizzle';
import { systemMetrics } from '../db/schema/metrics';
import { desc, avg, sql, count } from 'drizzle-orm';

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
const metricsRouter = new Hono();

// 获取最新系统指标
metricsRouter.get('/latest', async (c) => {
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
metricsRouter.get('/history', async (c) => {
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
metricsRouter.get('/stats', async (c) => {
  try {
    const stats = await getMetricsStats();
    return c.json({ success: true, data: stats });
  } catch (error) {
    console.error('获取指标统计失败:', error);
    return c.json({ success: false, error: '获取指标统计失败' }, 500);
  }
});

// 上传系统指标
metricsRouter.post('/', async (c) => {
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
metricsRouter.post('/generate-mock', async (c) => {
  try {
    const mockMetrics = generateMockMetrics();
    
    // 转换为正确的模式
    const newMetric = {
      cpuUsage: mockMetrics.cpu.usage,
      cpuTemperature: mockMetrics.cpu.temperature,
      memoryTotal: mockMetrics.memory.total,
      memoryUsed: mockMetrics.memory.used,
      diskTotal: mockMetrics.disk.total,
      diskUsed: mockMetrics.disk.used,
      networkBytesIn: mockMetrics.network.bytesIn,
      networkBytesOut: mockMetrics.network.bytesOut
    };
    
    // 使用Drizzle保存数据
    const [savedMetric] = await db.insert(systemMetrics).values(newMetric).returning();
    
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

// 系统指标接口
interface SystemMetricsData {
  cpu: {
    usage: number;
    temperature: number;
  };
  memory: {
    total: number;
    used: number;
    free: number;
  };
  disk: {
    total: number;
    used: number;
    free: number;
  };
  network: {
    bytesIn: number;
    bytesOut: number;
  };
}

/**
 * 将数据库格式转换为API格式
 */
function convertToApiFormat(dbMetric: any): SystemMetricsData {
  return {
    cpu: {
      usage: dbMetric.cpuUsage,
      temperature: dbMetric.cpuTemperature
    },
    memory: {
      total: dbMetric.memoryTotal,
      used: dbMetric.memoryUsed,
      free: dbMetric.memoryTotal - dbMetric.memoryUsed
    },
    disk: {
      total: dbMetric.diskTotal,
      used: dbMetric.diskUsed,
      free: dbMetric.diskTotal - dbMetric.diskUsed
    },
    network: {
      bytesIn: dbMetric.networkBytesIn,
      bytesOut: dbMetric.networkBytesOut
    }
  };
}

// GET /api/metrics/system - 获取系统指标
const getSystemMetricsSchema = z.object({
  limit: z.coerce.number().optional().default(20),
  timeRange: z.string().optional().default('24h'),
});

metricsRouter.get('/system', zValidator('query', getSystemMetricsSchema), async (c) => {
  const { limit, timeRange } = c.req.valid('query');
  
  try {
    // 基于timeRange计算时间范围
    const timeFilter = getTimeFilterFromRange(timeRange);
    
    // 获取系统指标
    const metricsData = await db.select()
      .from(systemMetrics)
      .where(timeFilter)
      .orderBy(desc(systemMetrics.createdAt))
      .limit(limit);

    // 获取总记录数
    const [{ value: totalCount }] = await db.select({
      value: count()
    }).from(systemMetrics).where(timeFilter);
    
    return c.json({
      success: true,
      count: metricsData.length,
      total: totalCount,
      metrics: metricsData,
    });
  } catch (error) {
    console.error('获取系统指标失败:', error);
    return c.json({
      success: false,
      error: '获取系统指标失败'
    }, 500);
  }
});

// POST /api/metrics/system/mock - 生成模拟数据
const mockDataSchema = z.object({
  count: z.number().optional().default(10),
  variation: z.number().optional().default(0.1),
});

metricsRouter.post('/system/mock', zValidator('json', mockDataSchema), async (c) => {
  const { count, variation } = c.req.valid('json');
  
  try {
    const generatedMetrics = [];
    
    // 基础值
    const baseValues = {
      cpuUsage: 45, // CPU使用率基准值 45%
      cpuTemperature: 65, // CPU温度基准值 65°C
      memoryTotal: 16 * 1024 * 1024 * 1024, // 16GB内存
      diskTotal: 512 * 1024 * 1024 * 1024, // 512GB磁盘
    };
    
    // 生成指定数量的模拟数据
    for (let i = 0; i < count; i++) {
      // 添加随机波动
      const randomVariation = (base: number) => base * (1 + (Math.random() * variation * 2 - variation));
      
      // CPU使用率 (30-70%)
      const cpuUsage = Math.min(Math.max(randomVariation(baseValues.cpuUsage), 10), 95);
      
      // CPU温度 (55-75°C)
      const cpuTemperature = Math.min(Math.max(randomVariation(baseValues.cpuTemperature), 50), 85);
      
      // 内存使用 (40-80%)
      const memoryTotal = baseValues.memoryTotal;
      const memoryUsagePercent = 40 + Math.random() * 40; // 40-80%
      const memoryUsed = Math.floor(memoryTotal * memoryUsagePercent / 100);
      const memoryFree = memoryTotal - memoryUsed; // 计算剩余内存
      
      // 磁盘使用 (50-85%)
      const diskTotal = baseValues.diskTotal;
      const diskUsagePercent = 50 + Math.random() * 35; // 50-85%
      const diskUsed = Math.floor(diskTotal * diskUsagePercent / 100);
      const diskFree = diskTotal - diskUsed; // 计算剩余磁盘空间
      
      // 网络流量 (1-50 MB/s)
      const networkBytesIn = Math.floor((1 + Math.random() * 49) * 1024 * 1024);
      const networkBytesOut = Math.floor((1 + Math.random() * 49) * 1024 * 1024);
      
      // 创建指标记录
      const metric = {
        cpuUsage,
        cpuTemperature,
        memoryUsed,
        memoryTotal,
        memoryFree, // 添加内存剩余字段
        diskUsed,
        diskTotal,
        diskFree, // 添加磁盘剩余字段
        networkBytesIn,
        networkBytesOut,
      };
      
      // 保存到数据库
      const [savedMetric] = await db.insert(systemMetrics)
        .values(metric)
        .returning();
      
      generatedMetrics.push(savedMetric);
    }
    
    return c.json({
      success: true,
      message: `成功生成 ${count} 条模拟系统指标数据`,
      count: generatedMetrics.length,
      sampleData: generatedMetrics[0],
    });
  } catch (error) {
    console.error('生成模拟系统指标数据失败:', error);
    return c.json({
      success: false,
      error: '生成模拟系统指标数据失败'
    }, 500);
  }
});

// GET /api/metrics/system/analyze - 分析系统指标
const analyzeMetricsSchema = z.object({
  timeRange: z.string().optional().default('24h'),
});

metricsRouter.get('/system/analyze', zValidator('query', analyzeMetricsSchema), async (c) => {
  const { timeRange } = c.req.valid('query');
  
  try {
    // 基于timeRange计算时间范围
    const timeFilter = getTimeFilterFromRange(timeRange);
    
    // 分析系统指标
    const [metrics] = await db.select({
      averageCpuUsage: avg(systemMetrics.cpuUsage),
      averageCpuTemperature: avg(systemMetrics.cpuTemperature),
      averageMemoryUsage: sql<number>`CAST(avg(${systemMetrics.memoryUsed} * 100.0 / ${systemMetrics.memoryTotal}) AS float)`,
      averageDiskUsage: sql<number>`CAST(avg(${systemMetrics.diskUsed} * 100.0 / ${systemMetrics.diskTotal}) AS float)`,
      averageNetworkIn: avg(systemMetrics.networkBytesIn),
      averageNetworkOut: avg(systemMetrics.networkBytesOut),
    }).from(systemMetrics).where(timeFilter);
    
    // 获取最新的指标数据用于实时状态
    const [latestMetric] = await db.select()
      .from(systemMetrics)
      .orderBy(desc(systemMetrics.createdAt))
      .limit(1);
    
    // 异常检测
    const anomalies: string[] = [];
    const recommendedActions: string[] = [];
    let hasAnomalies = false;
    
    // 使用类型安全的方式处理指标值
    const cpuUsage = Number(metrics.averageCpuUsage) || 0;
    const cpuTemp = Number(metrics.averageCpuTemperature) || 0;
    const memoryUsage = Number(metrics.averageMemoryUsage) || 0;
    const diskUsage = Number(metrics.averageDiskUsage) || 0;
    
    // 检查CPU
    if (cpuUsage > 80) {
      anomalies.push(`CPU使用率过高: ${cpuUsage.toFixed(1)}%`);
      recommendedActions.push('考虑扩展CPU资源或优化高CPU使用的进程');
      hasAnomalies = true;
    } else if (cpuUsage > 60) {
      anomalies.push(`CPU使用率偏高: ${cpuUsage.toFixed(1)}%`);
      recommendedActions.push('监控CPU使用率趋势，必要时考虑优化');
      hasAnomalies = true;
    }
    
    if (cpuTemp > 75) {
      anomalies.push(`CPU温度过高: ${cpuTemp.toFixed(1)}°C`);
      recommendedActions.push('检查服务器散热系统，考虑改善物理环境');
      hasAnomalies = true;
    }
    
    // 检查内存
    if (memoryUsage > 85) {
      anomalies.push(`内存使用率过高: ${memoryUsage.toFixed(1)}%`);
      recommendedActions.push('考虑扩展内存资源或优化高内存使用的应用');
      hasAnomalies = true;
    } else if (memoryUsage > 70) {
      anomalies.push(`内存使用率偏高: ${memoryUsage.toFixed(1)}%`);
      recommendedActions.push('监控内存使用率趋势，必要时考虑增加内存');
      hasAnomalies = true;
    }
    
    // 检查磁盘
    if (diskUsage > 90) {
      anomalies.push(`磁盘使用率过高: ${diskUsage.toFixed(1)}%`);
      recommendedActions.push('清理不必要的文件或考虑扩展存储空间');
      hasAnomalies = true;
    } else if (diskUsage > 75) {
      anomalies.push(`磁盘使用率偏高: ${diskUsage.toFixed(1)}%`);
      recommendedActions.push('监控磁盘使用趋势，规划存储扩展');
      hasAnomalies = true;
    }
    
    // 格式化平均值为字符串
    const formattedMetrics = {
      averageCpuUsage: cpuUsage.toFixed(1),
      averageCpuTemperature: cpuTemp.toFixed(1),
      averageMemoryUsage: memoryUsage.toFixed(1),
      averageDiskUsage: diskUsage.toFixed(1),
      averageNetworkIn: formatBytes(Number(metrics.averageNetworkIn || 0)),
      averageNetworkOut: formatBytes(Number(metrics.averageNetworkOut || 0)),
    };
    
    // 返回分析结果
    return c.json({
      success: true,
      analysis: {
        timeRange,
        metrics: formattedMetrics,
        latestMetric,
        hasAnomalies,
        anomalies,
        recommendedActions,
      },
    });
  } catch (error) {
    console.error('分析系统指标失败:', error);
    return c.json({
      success: false,
      error: '分析系统指标失败'
    }, 500);
  }
});

// 辅助函数：基于时间范围获取过滤条件
function getTimeFilterFromRange(timeRange: string) {
  const now = new Date();
  let startTime: Date;
  
  // 解析时间范围
  switch (timeRange) {
    case '1h':
      startTime = new Date(now.getTime() - 60 * 60 * 1000);
      break;
    case '6h':
      startTime = new Date(now.getTime() - 6 * 60 * 60 * 1000);
      break;
    case '12h':
      startTime = new Date(now.getTime() - 12 * 60 * 60 * 1000);
      break;
    case '7d':
      startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case '24h':
    default:
      startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
  }
  
  // 返回过滤条件
  return sql`${systemMetrics.createdAt} >= ${startTime.toISOString()}`;
}

// 辅助函数：格式化字节大小
function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export const metricsRoutes = metricsRouter; 