/**
 * 业务指标相关API路由
 */
import { Hono } from 'hono';
import { db } from '../db';
import { businessMetrics, businessMetricsData } from '../db/schema';
import { eq, desc, and, gte, lte } from 'drizzle-orm';

const businessMetricsRoutes = new Hono();

// 获取所有业务指标
businessMetricsRoutes.get('/', async (c) => {
  try {
    const metrics = await db.select().from(businessMetrics).orderBy(desc(businessMetrics.updatedAt));
    return c.json({ success: true, metrics });
  } catch (error) {
    console.error('Error fetching business metrics:', error);
    return c.json({ success: false, message: 'Failed to fetch business metrics' }, 500);
  }
});

// 获取单个业务指标
businessMetricsRoutes.get('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const metric = await db.select().from(businessMetrics).where(eq(businessMetrics.id, Number(id))).limit(1);
    
    if (metric.length === 0) {
      return c.json({ success: false, message: 'Metric not found' }, 404);
    }
    
    return c.json({ success: true, metric: metric[0] });
  } catch (error) {
    console.error(`Error fetching business metric with id ${c.req.param('id')}:`, error);
    return c.json({ success: false, message: 'Failed to fetch business metric' }, 500);
  }
});

// 创建业务指标
businessMetricsRoutes.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const {
      name,
      description,
      category,
      query,
      dataSource,
      warningThreshold,
      criticalThreshold,
      unit,
      aggregation,
      status
    } = body;
    
    // 基本验证
    if (!name || !category || !query || !dataSource || !aggregation) {
      return c.json({
        success: false,
        message: 'Missing required fields: name, category, query, dataSource, aggregation'
      }, 400);
    }
    
    const now = new Date();
    const newMetric = await db.insert(businessMetrics).values({
      name,
      description,
      category,
      query,
      dataSource,
      warningThreshold,
      criticalThreshold,
      unit,
      aggregation,
      status: status || 'draft',
      createdAt: now,
      updatedAt: now
    }).returning();
    
    return c.json({ success: true, metric: newMetric[0] }, 201);
  } catch (error) {
    console.error('Error creating business metric:', error);
    return c.json({ success: false, message: 'Failed to create business metric' }, 500);
  }
});

// 更新业务指标
businessMetricsRoutes.put('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const body = await c.req.json();
    const {
      name,
      description,
      category,
      query,
      dataSource,
      warningThreshold,
      criticalThreshold,
      unit,
      aggregation,
      status
    } = body;
    
    // 检查指标是否存在
    const existingMetric = await db.select({ id: businessMetrics.id })
      .from(businessMetrics)
      .where(eq(businessMetrics.id, Number(id)))
      .limit(1);
      
    if (existingMetric.length === 0) {
      return c.json({ success: false, message: 'Metric not found' }, 404);
    }
    
    // 更新指标
    const updatedMetric = await db.update(businessMetrics)
      .set({
        name,
        description,
        category,
        query,
        dataSource,
        warningThreshold,
        criticalThreshold,
        unit,
        aggregation,
        status,
        updatedAt: new Date()
      })
      .where(eq(businessMetrics.id, Number(id)))
      .returning();
    
    return c.json({ success: true, metric: updatedMetric[0] });
  } catch (error) {
    console.error(`Error updating business metric with id ${c.req.param('id')}:`, error);
    return c.json({ success: false, message: 'Failed to update business metric' }, 500);
  }
});

// 删除业务指标
businessMetricsRoutes.delete('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    
    // 检查指标是否存在
    const existingMetric = await db.select({ id: businessMetrics.id })
      .from(businessMetrics)
      .where(eq(businessMetrics.id, Number(id)))
      .limit(1);
      
    if (existingMetric.length === 0) {
      return c.json({ success: false, message: 'Metric not found' }, 404);
    }
    
    // 删除相关的历史数据
    await db.delete(businessMetricsData)
      .where(eq(businessMetricsData.metricId, Number(id)));
    
    // 删除指标
    await db.delete(businessMetrics)
      .where(eq(businessMetrics.id, Number(id)));
    
    return c.json({ success: true, message: 'Metric deleted successfully' });
  } catch (error) {
    console.error(`Error deleting business metric with id ${c.req.param('id')}:`, error);
    return c.json({ success: false, message: 'Failed to delete business metric' }, 500);
  }
});

// 获取指标数据
businessMetricsRoutes.get('/:id/data', async (c) => {
  try {
    const { id } = c.req.param();
    const { timeRange = '24h' } = c.req.query();
    
    // 检查指标是否存在
    const existingMetric = await db.select({ id: businessMetrics.id })
      .from(businessMetrics)
      .where(eq(businessMetrics.id, Number(id)))
      .limit(1);
      
    if (existingMetric.length === 0) {
      return c.json({ success: false, message: 'Metric not found' }, 404);
    }
    
    // 计算时间范围
    const now = new Date();
    let startTime: Date;
    
    switch (timeRange) {
      case '1h':
        startTime = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case '6h':
        startTime = new Date(now.getTime() - 6 * 60 * 60 * 1000);
        break;
      case '24h':
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }
    
    // 获取时间范围内的数据
    const data = await db.select()
      .from(businessMetricsData)
      .where(
        and(
          eq(businessMetricsData.metricId, Number(id)),
          gte(businessMetricsData.timestamp, startTime),
          lte(businessMetricsData.timestamp, now)
        )
      )
      .orderBy(desc(businessMetricsData.timestamp));
    
    // 如果没有数据，生成模拟数据用于开发环境
    if (data.length === 0 && process.env.NODE_ENV === 'development') {
      const mockData = generateMockData(Number(id), startTime, now);
      return c.json({ success: true, data: mockData });
    }
    
    return c.json({ success: true, data });
  } catch (error) {
    console.error(`Error fetching data for business metric with id ${c.req.param('id')}:`, error);
    return c.json({ success: false, message: 'Failed to fetch metric data' }, 500);
  }
});

// 帮助函数：生成模拟数据
function generateMockData(metricId: number, startTime: Date, endTime: Date) {
  const data = [];
  const duration = endTime.getTime() - startTime.getTime();
  const interval = duration / 50; // 生成约50个数据点
  
  let currentTime = startTime;
  while (currentTime <= endTime) {
    data.push({
      id: `mock_${metricId}_${data.length}`,
      metricId,
      value: Math.random() * 100, // 随机值
      timestamp: currentTime
    });
    
    currentTime = new Date(currentTime.getTime() + interval);
  }
  
  return data;
}

export default businessMetricsRoutes; 