import { Hono } from 'hono';
import { db } from '../db';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { datasources } from '../db/schema/datasources';
import { eq } from 'drizzle-orm';

// 创建路由
const datasourcesRoute = new Hono();

// 数据源类型枚举
export const datasourceTypes = [
  'prometheus',
  'grafana',
  'elasticsearch',
  'cloudwatch',
  'database',
  'custom'
] as const;

// 数据源状态枚举
export const datasourceStatus = [
  'connected',
  'error',
  'pending'
] as const;

// 添加数据源验证
const addDatasourceSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(datasourceTypes),
  url: z.string().url(),
  description: z.string().optional(),
  credentials: z.object({
    apiKey: z.string().optional(),
  }).optional(),
});

// 获取所有数据源
datasourcesRoute.get('/', async (c) => {
  try {
    const dataSources = await db.select().from(datasources);
    
    // 处理日期格式
    const formattedDataSources = dataSources.map(ds => ({
      ...ds,
      lastSync: ds.lastSync ? new Date(ds.lastSync) : null
    }));
    
    return c.json({
      success: true,
      dataSources: formattedDataSources
    });
  } catch (error) {
    console.error('Error fetching data sources:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch data sources'
    }, 500);
  }
});

// 获取单个数据源
datasourcesRoute.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    
    const dataSourceResults = await db.select()
      .from(datasources)
      .where(eq(datasources.id, id));
    
    const dataSource = dataSourceResults[0];
    
    if (!dataSource) {
      return c.json({
        success: false,
        error: 'Data source not found'
      }, 404);
    }
    
    return c.json({
      success: true,
      dataSource: {
        ...dataSource,
        lastSync: dataSource.lastSync ? new Date(dataSource.lastSync) : null
      }
    });
  } catch (error) {
    console.error('Error fetching data source:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch data source'
    }, 500);
  }
});

// 添加数据源
datasourcesRoute.post('/', zValidator('json', addDatasourceSchema), async (c) => {
  try {
    const body = await c.req.valid('json');
    
    const newDataSource = {
      name: body.name,
      type: body.type,
      url: body.url,
      description: body.description || '',
      status: 'pending', // 新添加的数据源状态默认为pending
      credentials: body.credentials ? JSON.stringify(body.credentials) : null,
      lastSync: null,
      metrics: 0,
      createdAt: new Date()
    };
    
    const result = await db.insert(datasources).values(newDataSource).returning();
    
    return c.json({
      success: true,
      dataSource: {
        ...result[0],
        lastSync: result[0].lastSync ? new Date(result[0].lastSync) : null
      }
    }, 201);
  } catch (error) {
    console.error('Error adding data source:', error);
    return c.json({
      success: false,
      error: 'Failed to add data source'
    }, 500);
  }
});

// 更新数据源
datasourcesRoute.put('/:id', zValidator('json', addDatasourceSchema.partial()), async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.valid('json');
    
    // 检查数据源是否存在
    const existingResults = await db.select()
      .from(datasources)
      .where(eq(datasources.id, id));
    
    const existingDataSource = existingResults[0];
    
    if (!existingDataSource) {
      return c.json({
        success: false,
        error: 'Data source not found'
      }, 404);
    }
    
    // 更新数据源
    const updatedDataSource = {
      ...body,
      credentials: body.credentials ? JSON.stringify(body.credentials) : existingDataSource.credentials,
      updatedAt: new Date()
    };
    
    const result = await db.update(datasources)
      .set(updatedDataSource)
      .where(eq(datasources.id, id))
      .returning();
    
    return c.json({
      success: true,
      dataSource: {
        ...result[0],
        lastSync: result[0].lastSync ? new Date(result[0].lastSync) : null
      }
    });
  } catch (error) {
    console.error('Error updating data source:', error);
    return c.json({
      success: false,
      error: 'Failed to update data source'
    }, 500);
  }
});

// 删除数据源
datasourcesRoute.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    
    // 检查数据源是否存在
    const existingResults = await db.select()
      .from(datasources)
      .where(eq(datasources.id, id));
    
    const existingDataSource = existingResults[0];
    
    if (!existingDataSource) {
      return c.json({
        success: false,
        error: 'Data source not found'
      }, 404);
    }
    
    // 删除数据源
    await db.delete(datasources)
      .where(eq(datasources.id, id));
    
    return c.json({
      success: true,
      message: 'Data source deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting data source:', error);
    return c.json({
      success: false,
      error: 'Failed to delete data source'
    }, 500);
  }
});

// 测试数据源连接
datasourcesRoute.post('/:id/test', async (c) => {
  try {
    const id = c.req.param('id');
    
    // 检查数据源是否存在
    const dataSourceResults = await db.select()
      .from(datasources)
      .where(eq(datasources.id, id));
    
    const dataSource = dataSourceResults[0];
    
    if (!dataSource) {
      return c.json({
        success: false,
        error: 'Data source not found'
      }, 404);
    }
    
    // 模拟连接测试
    const testResult = {
      success: Math.random() > 0.2, // 80%概率测试成功
      latency: Math.round(Math.random() * 500),
      message: ''
    };
    
    if (testResult.success) {
      testResult.message = 'Connection successful';
      
      // 更新数据源状态为connected
      await db.update(datasources)
        .set({ 
          status: 'connected', 
          lastSync: new Date()
        })
        .where(eq(datasources.id, id));
    } else {
      testResult.message = 'Connection failed: timeout';
      
      // 更新数据源状态为error
      await db.update(datasources)
        .set({ status: 'error' })
        .where(eq(datasources.id, id));
    }
    
    return c.json({
      success: true,
      test: testResult
    });
  } catch (error) {
    console.error('Error testing data source:', error);
    return c.json({
      success: false,
      error: 'Failed to test data source'
    }, 500);
  }
});

// 获取数据源指标
datasourcesRoute.get('/metrics', async (c) => {
  try {
    // 模拟数据源的指标数据
    const metricsData = [
      {
        sourceId: 'ds-1',
        sourceName: 'Prometheus 1',
        sourceType: 'prometheus',
        metrics: generateMockMetrics(8)
      },
      {
        sourceId: 'ds-2',
        sourceName: 'Grafana 1',
        sourceType: 'grafana',
        metrics: generateMockMetrics(6)
      },
      {
        sourceId: 'ds-3',
        sourceName: 'Elasticsearch 1',
        sourceType: 'elasticsearch',
        metrics: generateMockMetrics(5)
      }
    ];
    
    return c.json({
      success: true,
      metrics: metricsData
    });
  } catch (error) {
    console.error('Error fetching metrics data:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch metrics data'
    }, 500);
  }
});

// 生成模拟指标数据
function generateMockMetrics(count: number) {
  const metricNames = [
    'CPU Usage', 'Memory Usage', 'Disk I/O', 'Network Traffic', 
    'Request Rate', 'Error Rate', 'Response Time', 'Queue Length',
    'Database Connections', 'Cache Hit Rate'
  ];
  const units = ['%', 'MB', 'req/s', 'ms', 'count', 'GB/s'];
  const statuses = ['normal', 'warning', 'critical'] as const;
  
  return Array.from({ length: count }, (_, i) => {
    const name = metricNames[Math.floor(Math.random() * metricNames.length)];
    const unit = units[Math.floor(Math.random() * units.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    
    return {
      id: `metric-${i}`,
      name,
      value: Math.round(Math.random() * 100 * 100) / 100,
      unit,
      timestamp: new Date(),
      status,
      trend: Array.from({ length: 10 }, () => Math.round(Math.random() * 100))
    };
  });
}

export default datasourcesRoute; 