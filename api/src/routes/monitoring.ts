import { Hono } from 'hono';
import { z } from 'zod';
import { qw, PROMPTS, PROMPT_TYPES } from '../mastra';
import { streamSSE } from 'hono/streaming';

// 创建监控路由
const monitoringRoutes = new Hono();

// 验证获取监控数据请求
const monitoringRequestSchema = z.object({
  metric: z.enum(['cpu', 'memory', 'disk', 'network', 'all']).optional(),
  timeRange: z.object({
    start: z.string().optional(),
    end: z.string().optional(),
  }).optional(),
  interval: z.enum(['1m', '5m', '15m', '1h', '6h', '12h', '1d']).optional(),
  hosts: z.array(z.string()).optional(),
});

// 模拟指标数据生成函数
function generateMetrics(metric = 'all', hosts = ['server1', 'server2']) {
  const now = Date.now();
  const timePoints = Array.from({ length: 30 }, (_, i) => now - i * 60000);
  
  // 生成模拟指标数据
  const generateSeriesData = (min: number, max: number) => {
    return timePoints.map(timestamp => {
      return {
        timestamp: new Date(timestamp).toISOString(),
        value: min + Math.random() * (max - min)
      };
    });
  };
  
  const metrics: Record<string, any> = {};
  
  // 根据请求的指标类型生成数据
  if (metric === 'all' || metric === 'cpu') {
    metrics.cpu = hosts.reduce((acc, _host) => {
      acc[_host] = generateSeriesData(0, 100);
      return acc;
    }, {});
  }
  
  if (metric === 'all' || metric === 'memory') {
    metrics.memory = hosts.reduce((acc, _host) => {
      acc[_host] = generateSeriesData(20, 90);
      return acc;
    }, {});
  }
  
  if (metric === 'all' || metric === 'disk') {
    metrics.disk = hosts.reduce((acc, _host) => {
      acc[_host] = generateSeriesData(10, 80);
      return acc;
    }, {});
  }
  
  if (metric === 'all' || metric === 'network') {
    metrics.network = {
      in: generateSeriesData(0, 100),
      out: generateSeriesData(0, 80)
    };
  }
  
  return metrics;
}

// 获取监控数据端点
monitoringRoutes.get('/metrics', async (c) => {
  try {
    const query = c.req.query();
    const metric = query.metric || 'all';
    const hosts = query.hosts ? query.hosts.split(',') : ['server1', 'server2'];
    
    // 生成模拟指标数据
    const metrics = generateMetrics(metric, hosts);
    
    return c.json({
      metrics,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('获取监控指标错误:', error);
    return c.json(
      { error: '获取监控指标失败' },
      { status: 500 }
    );
  }
});

// 获取系统状态端点
monitoringRoutes.get('/status', async (c) => {
  try {
    // 模拟系统状态数据
    const services = [
      { name: 'Web Server', status: 'online', uptime: '10d 4h 30m' },
      { name: 'Database', status: 'online', uptime: '8d 12h 45m' },
      { name: 'Cache', status: 'online', uptime: '5d 8h 12m' },
      { name: 'Message Queue', status: 'online', uptime: '3d 6h 8m' },
      { name: 'Search Service', status: 'online', uptime: '7d 3h 21m' },
    ];
    
    return c.json({
      services,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('获取系统状态错误:', error);
    return c.json(
      { error: '获取系统状态失败' },
      { status: 500 }
    );
  }
});

// AI分析监控数据端点 - 流式响应
monitoringRoutes.post('/analyze', async (c) => {
  return streamSSE(c, async (stream) => {
    try {
      console.log('接收到监控数据AI分析请求');
      const body = await c.req.json();
      
      // 验证请求
      const result = monitoringRequestSchema.safeParse(body);
      if (!result.success) {
        console.error('请求验证失败:', JSON.stringify(result.error.format()));
        await stream.writeSSE({
          data: JSON.stringify({ 
            error: '无效请求',
            details: result.error.format()
          })
        });
        return;
      }
      
      const { metric = 'all', timeRange, interval = '5m', hosts = ['server1', 'server2'] } = result.data;
      
      // 生成模拟指标数据
      const metrics = generateMetrics(metric, hosts);
      
      // 构建分析提示
      const analysisPrompt = `
请分析以下系统监控数据:
- 指标类型: ${metric}
- 时间范围: ${timeRange ? `${timeRange.start || '未指定'} 到 ${timeRange.end || '未指定'}` : '未指定'}
- 采样间隔: ${interval}
- 主机: ${hosts.join(', ')}

监控数据:
\`\`\`json
${JSON.stringify(metrics, null, 2)}
\`\`\`

请执行以下分析:
1. 总体系统健康状况
2. 识别所有异常指标和趋势
3. 可能的性能瓶颈
4. 资源使用率分析
5. 优化建议
`;

      console.log('开始AI分析监控数据');
      try {
        // 使用千问AI进行分析
        const response = await qw({
          messages: [
            { role: 'system', content: PROMPTS[PROMPT_TYPES.MONITORING] },
            { role: 'user', content: analysisPrompt }
          ],
          stream: true,
        });
        
        // 处理流式响应
        for await (const chunk of response) {
          const content = chunk.choices?.[0]?.delta?.content || '';
          if (content) {
            await stream.writeSSE({
              data: JSON.stringify({
                type: 'chunk',
                content,
                timestamp: new Date().toISOString(),
              })
            });
          }
        }
        
        console.log('AI分析监控数据完成');
        
        // 发送完成信号
        await stream.writeSSE({
          data: JSON.stringify({
            type: 'done',
            timestamp: new Date().toISOString(),
          })
        });
      } catch (err) {
        console.error('AI分析监控数据错误:', err);
        await stream.writeSSE({
          data: JSON.stringify({ 
            error: 'AI处理监控数据分析失败',
            message: err instanceof Error ? err.message : '未知错误'
          })
        });
      }
      
    } catch (error) {
      console.error('监控数据分析请求处理错误:', error);
      await stream.writeSSE({
        data: JSON.stringify({ 
          error: '处理监控数据分析请求失败',
          message: error instanceof Error ? error.message : '未知错误'
        })
      });
    }
  });
});

// 获取系统警报端点
monitoringRoutes.get('/alerts', async (c) => {
  try {
    // 模拟警报数据
    const alerts = [
      { id: 'alert-1', severity: 'critical', message: 'High CPU usage on server1', timestamp: new Date(Date.now() - 300000).toISOString() },
      { id: 'alert-2', severity: 'warning', message: 'Memory usage above 80% on server2', timestamp: new Date(Date.now() - 600000).toISOString() },
      { id: 'alert-3', severity: 'info', message: 'Disk cleanup scheduled', timestamp: new Date(Date.now() - 3600000).toISOString() },
    ];
    
    return c.json({
      alerts,
      count: alerts.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('获取系统警报错误:', error);
    return c.json(
      { error: '获取系统警报失败' },
      { status: 500 }
    );
  }
});

// 获取系统总体健康状态
monitoringRoutes.get('/health', (c) => {
  const status = Math.random() > 0.1 ? 'healthy' : 'degraded';
  const components = [
    { name: 'api', status: Math.random() > 0.05 ? 'up' : 'down' },
    { name: 'database', status: Math.random() > 0.05 ? 'up' : 'down' },
    { name: 'auth', status: Math.random() > 0.05 ? 'up' : 'down' },
    { name: 'cache', status: Math.random() > 0.05 ? 'up' : 'down' }
  ];
  
  return c.json({
    status,
    timestamp: new Date().toISOString(),
    components
  });
});

// 获取服务可用性
monitoringRoutes.get('/availability', (c) => {
  const services = ['api', 'database', 'auth', 'web', 'cache'];
  const availability = services.map(service => {
    // 生成过去24小时内的可用性，通常在95-100%之间
    const value = 95 + Math.random() * 5;
    // 模拟历史数据点
    const history = Array.from({ length: 24 }, () => 94 + Math.random() * 6);
    
    return {
      service,
      availability: value.toFixed(2),
      unit: '%',
      history,
      trend: value > 99 ? 'stable' : value > 97 ? 'improving' : 'degrading',
      last_checked: new Date().toISOString()
    };
  });
  
  return c.json({ availability });
});

// 获取响应时间
monitoringRoutes.get('/response-times', (c) => {
  const endpoints = [
    '/api/users', 
    '/api/auth/login', 
    '/api/metrics', 
    '/api/logs', 
    '/api/alerts'
  ];
  
  const responseTimeData = endpoints.map(endpoint => {
    // 生成50-500ms之间的响应时间
    const value = 50 + Math.random() * 450;
    // 模拟过去6小时的数据点
    const history = Array.from({ length: 6 }, () => 40 + Math.random() * 460);
    
    return {
      endpoint,
      value: value.toFixed(2),
      unit: 'ms',
      history,
      threshold: 500,
      status: value > 500 ? 'warning' : 'normal',
      last_checked: new Date().toISOString()
    };
  });
  
  return c.json({ response_times: responseTimeData });
});

// 获取错误率
monitoringRoutes.get('/error-rates', (c) => {
  const services = ['api', 'database', 'auth', 'web', 'cache'];
  const errorRateData = services.map(service => {
    // 生成0-5%之间的错误率
    const value = Math.random() * 5;
    // 模拟过去12小时的数据点
    const history = Array.from({ length: 12 }, () => Math.random() * 6);
    
    return {
      service,
      value: value.toFixed(2),
      unit: '%',
      history,
      threshold: 2,
      status: value > 2 ? 'warning' : 'normal',
      last_checked: new Date().toISOString()
    };
  });
  
  return c.json({ error_rates: errorRateData });
});

// 获取基础设施状态
monitoringRoutes.get('/infrastructure', (c) => {
  const resources = [
    { type: 'server', id: 'srv-1', role: 'api' },
    { type: 'server', id: 'srv-2', role: 'database' },
    { type: 'server', id: 'srv-3', role: 'worker' },
    { type: 'database', id: 'db-1', role: 'primary' },
    { type: 'cache', id: 'cache-1', role: 'main' }
  ];
  
  const infrastructureData = resources.map(resource => {
    // 生成负载指标
    const metrics = {
      cpu: {
        value: (40 + Math.random() * 60).toFixed(1),
        unit: '%',
        status: Math.random() > 0.8 ? 'warning' : 'normal'
      },
      memory: {
        value: (50 + Math.random() * 40).toFixed(1),
        unit: '%',
        status: Math.random() > 0.8 ? 'warning' : 'normal'
      },
      disk: {
        value: (30 + Math.random() * 60).toFixed(1),
        unit: '%',
        status: Math.random() > 0.9 ? 'warning' : 'normal'
      }
    };
    
    return {
      ...resource,
      status: Math.random() > 0.05 ? 'running' : 'degraded',
      uptime: Math.floor(Math.random() * 30 * 24 * 60 * 60), // 随机生成最多30天的正常运行时间（秒）
      metrics,
      last_checked: new Date().toISOString()
    };
  });
  
  return c.json({ infrastructure: infrastructureData });
});

export { monitoringRoutes }; 