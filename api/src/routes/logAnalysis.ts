import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

// 创建日志分析路由
const logAnalysisRoutes = new Hono();

// 获取日志洞察
logAnalysisRoutes.get('/insights', (c) => {
  return c.json({ insights: generateMockInsights() });
});

// 获取异常检测结果
logAnalysisRoutes.get('/anomalies', (c) => {
  const timeRange = c.req.query('timeRange') || '24h';
  const service = c.req.query('service');
  const severity = c.req.query('severity');
  
  let anomalies = generateMockAnomalies();
  
  if (service) {
    anomalies = anomalies.filter(a => a.service === service);
  }
  
  if (severity) {
    anomalies = anomalies.filter(a => a.severity === severity);
  }
  
  return c.json({ 
    anomalies,
    metadata: {
      timeRange,
      count: anomalies.length,
      generatedAt: new Date().toISOString()
    }
  });
});

// 获取日志模式
logAnalysisRoutes.get('/patterns', (c) => {
  return c.json({ patterns: generateMockPatterns() });
});

// 分析特定日志
logAnalysisRoutes.post('/analyze', zValidator('json', z.object({
  logs: z.array(z.object({
    timestamp: z.string(),
    level: z.string(),
    message: z.string(),
    service: z.string().optional(),
    metadata: z.record(z.any()).optional(),
  })).min(1).max(100),
  options: z.object({
    detectAnomalies: z.boolean().optional().default(true),
    findPatterns: z.boolean().optional().default(true),
    extractInsights: z.boolean().optional().default(true),
  }).optional(),
})), (c) => {
  const body = c.req.valid('json');
  
  // 进行分析
  const analysis = {
    summary: `分析了 ${body.logs.length} 条日志`,
    topIssues: [
      {
        type: 'error',
        count: Math.floor(Math.random() * body.logs.length * 0.3),
        description: '连接超时错误',
        examples: ['Connection timed out', 'Failed to connect to database']
      },
      {
        type: 'warning',
        count: Math.floor(Math.random() * body.logs.length * 0.4),
        description: '资源使用率高',
        examples: ['High CPU usage detected', 'Memory usage above threshold']
      }
    ],
    patterns: generateMockPatterns(3),
    anomalies: generateMockAnomalies(2),
    timeSeries: {
      errorRate: generateTimeSeries(24),
      responseTime: generateTimeSeries(24),
    },
    recommendations: [
      {
        id: `rec-${Math.random().toString(36).substring(2, 10)}`,
        title: '检查数据库连接池设置',
        description: '多次出现数据库连接超时，建议增加连接池大小或优化查询性能。',
        priority: 'high'
      },
      {
        id: `rec-${Math.random().toString(36).substring(2, 10)}`,
        title: '监控API服务内存使用',
        description: '检测到内存使用率持续上升，可能存在内存泄漏问题。',
        priority: 'medium'
      }
    ]
  };
  
  return c.json({ analysis });
});

// 日志搜索与上下文
logAnalysisRoutes.get('/search-context', (c) => {
  const query = c.req.query('q');
  const timeRange = c.req.query('timeRange') || '24h';
  const contextLines = parseInt(c.req.query('context') || '5');
  
  if (!query) {
    return c.json({ error: '搜索查询不能为空' }, { status: 400 });
  }
  
  // 假设这是在真实环境中搜索到的日志事件
  const matchedEvents = [
    {
      id: `event-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date(Date.now() - Math.floor(Math.random() * 24 * 60 * 60 * 1000)).toISOString(),
      message: `发现错误模式: ${query}`,
      matchLine: Math.floor(Math.random() * 100) + 1,
      context: Array.from({ length: contextLines * 2 + 1 }, (_, i) => ({
        lineNumber: Math.floor(Math.random() * 100) + 1 - contextLines + i,
        content: i === contextLines 
          ? `ERROR: 服务故障，包含 ${query}` 
          : `INFO: 正常日志行 ${Math.floor(Math.random() * 1000)}`,
        isMatch: i === contextLines
      }))
    },
    {
      id: `event-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date(Date.now() - Math.floor(Math.random() * 24 * 60 * 60 * 1000)).toISOString(),
      message: `另一个包含 ${query} 的错误`,
      matchLine: Math.floor(Math.random() * 100) + 1,
      context: Array.from({ length: contextLines * 2 + 1 }, (_, i) => ({
        lineNumber: Math.floor(Math.random() * 100) + 1 - contextLines + i,
        content: i === contextLines 
          ? `WARN: 可能的问题，涉及 ${query}` 
          : `INFO: 正常日志行 ${Math.floor(Math.random() * 1000)}`,
        isMatch: i === contextLines
      }))
    }
  ];
  
  return c.json({ 
    query,
    timeRange,
    contextLines,
    matchCount: matchedEvents.length,
    events: matchedEvents
  });
});

// 生成模拟洞察数据
function generateMockInsights(count = 5) {
  const categories = ['性能', '错误', '安全', '资源使用', '用户行为'];
  const services = ['api', 'database', 'auth', 'web', 'cache', 'worker'];
  const insights = [];
  
  for (let i = 0; i < count; i++) {
    const category = categories[Math.floor(Math.random() * categories.length)];
    const service = services[Math.floor(Math.random() * services.length)];
    let title, description;
    
    switch (category) {
      case '性能':
        title = `${service} 服务响应时间增加`;
        description = `过去 6 小时内，${service} 服务的平均响应时间增加了 30%，从 120ms 上升到 156ms。`;
        break;
      case '错误':
        title = `${service} 服务错误率上升`;
        description = `${service} 服务的错误率从 0.5% 上升到 2.3%，主要是由连接超时错误引起的。`;
        break;
      case '安全':
        title = `检测到异常登录尝试`;
        description = `在过去 24 小时内，检测到来自 3 个不同 IP 地址的 15 次失败登录尝试。`;
        break;
      case '资源使用':
        title = `${service} 服务内存使用率高`;
        description = `${service} 服务的内存使用率持续保持在 85% 以上，可能需要增加资源或优化内存使用。`;
        break;
      case '用户行为':
        title = `用户活动模式变化`;
        description = `用户登录活动出现异常峰值，比平时增加了 40%。`;
        break;
      default:
        title = `${service} 服务观察`;
        description = `发现 ${service} 服务的日志模式异常。`;
    }
    
    insights.push({
      id: `insight-${Math.random().toString(36).substring(2, 10)}`,
      title,
      description,
      category,
      service,
      severity: ['high', 'medium', 'low'][Math.floor(Math.random() * 3)],
      timestamp: new Date(Date.now() - Math.floor(Math.random() * 24 * 60 * 60 * 1000)).toISOString(),
      confidence: 70 + Math.floor(Math.random() * 30),
      relatedMetrics: ['cpu_usage', 'memory_usage', 'response_time', 'error_rate'].slice(0, Math.floor(Math.random() * 3) + 1),
      trend: ['increasing', 'decreasing', 'stable'][Math.floor(Math.random() * 3)],
      recommendations: [
        `监控 ${service} 服务的性能指标`,
        `检查 ${service} 服务的配置`,
        `考虑增加 ${service} 服务的资源`
      ].slice(0, Math.floor(Math.random() * 3) + 1)
    });
  }
  
  return insights;
}

// 生成模拟异常数据
function generateMockAnomalies(count = 8) {
  const services = ['api', 'database', 'auth', 'web', 'cache', 'worker'];
  const anomalyTypes = ['spike', 'drop', 'trend', 'outlier', 'pattern_change'];
  const metrics = ['error_rate', 'response_time', 'request_count', 'resource_usage'];
  const anomalies = [];
  
  for (let i = 0; i < count; i++) {
    const service = services[Math.floor(Math.random() * services.length)];
    const anomalyType = anomalyTypes[Math.floor(Math.random() * anomalyTypes.length)];
    const metric = metrics[Math.floor(Math.random() * metrics.length)];
    
    anomalies.push({
      id: `anomaly-${Math.random().toString(36).substring(2, 10)}`,
      service,
      type: anomalyType,
      metric,
      description: getAnomalyDescription(service, anomalyType, metric),
      severity: ['critical', 'high', 'medium', 'low'][Math.floor(Math.random() * 4)],
      score: Math.floor(Math.random() * 50) + 50, // 异常分数：50-100
      detected_at: new Date(Date.now() - Math.floor(Math.random() * 24 * 60 * 60 * 1000)).toISOString(),
      duration: Math.floor(Math.random() * 30) + 1, // 持续时间（分钟）
      status: ['active', 'resolved', 'investigating'][Math.floor(Math.random() * 3)],
      data_points: {
        expected: generateTimeSeries(12, 50, 10),
        actual: generateTimeSeries(12, 50, 30)
      }
    });
  }
  
  return anomalies;
}

// 生成模拟日志模式数据
function generateMockPatterns(count = 6) {
  const patterns = [];
  const patternTypes = ['error', 'warning', 'info', 'sequence', 'correlation'];
  
  for (let i = 0; i < count; i++) {
    const type = patternTypes[Math.floor(Math.random() * patternTypes.length)];
    let pattern, examples;
    
    switch(type) {
      case 'error':
        pattern = 'ConnectionError: .*';
        examples = [
          'ConnectionError: Failed to connect to database',
          'ConnectionError: Connection timeout after 30s',
          'ConnectionError: Max retries exceeded'
        ];
        break;
      case 'warning':
        pattern = 'High (CPU|memory|disk) usage: ([0-9]+)%';
        examples = [
          'High CPU usage: 92%',
          'High memory usage: 87%',
          'High disk usage: 95%'
        ];
        break;
      case 'info':
        pattern = 'User ([a-z0-9]+) logged in from ([0-9.]+)';
        examples = [
          'User john123 logged in from 192.168.1.55',
          'User admin logged in from 10.0.0.15',
          'User guest logged in from 172.16.254.1'
        ];
        break;
      case 'sequence':
        pattern = 'Service (start|stop) sequence';
        examples = [
          'Service start sequence: web -> api -> worker',
          'Service stop sequence: worker -> api -> web',
          'Service start sequence: database -> cache -> api'
        ];
        break;
      case 'correlation':
        pattern = '(Database|API|Auth) failure after (system|network) change';
        examples = [
          'Database failure after system update',
          'API failure after network maintenance',
          'Auth failure after system restart'
        ];
        break;
      default:
        pattern = 'Generic pattern';
        examples = ['Example 1', 'Example 2', 'Example 3'];
    }
    
    patterns.push({
      id: `pattern-${Math.random().toString(36).substring(2, 10)}`,
      type,
      pattern,
      frequency: Math.floor(Math.random() * 100) + 1,
      first_seen: new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)).toISOString(),
      last_seen: new Date(Date.now() - Math.floor(Math.random() * 2 * 24 * 60 * 60 * 1000)).toISOString(),
      services: Array.from(new Set([
        ['api', 'web', 'database', 'auth', 'cache'][Math.floor(Math.random() * 5)],
        ['api', 'web', 'database', 'auth', 'cache'][Math.floor(Math.random() * 5)]
      ])),
      examples: examples.slice(0, Math.floor(Math.random() * 3) + 1),
      is_known_issue: Math.random() > 0.7,
      categorized: Math.random() > 0.5 ? true : false,
      category: Math.random() > 0.5 ? ['infrastructure', 'application', 'security', 'performance'][Math.floor(Math.random() * 4)] : null
    });
  }
  
  return patterns;
}

// 辅助函数：根据参数生成异常描述
function getAnomalyDescription(service, type, metric) {
  switch (type) {
    case 'spike':
      return `${service} 服务的 ${metric} 出现异常峰值，短时间内上升了 200%。`;
    case 'drop':
      return `${service} 服务的 ${metric} 突然下降 75%，可能表明服务部分中断。`;
    case 'trend':
      return `${service} 服务的 ${metric} 在过去 6 小时内持续增加，上升了 45%。`;
    case 'outlier':
      return `检测到 ${service} 服务的 ${metric} 出现离群值，偏离平均值 3 个标准差。`;
    case 'pattern_change':
      return `${service} 服务的 ${metric} 日常模式发生变化，不再遵循之前的周期性。`;
    default:
      return `${service} 服务的 ${metric} 出现异常。`;
  }
}

// 辅助函数：生成时间序列数据
function generateTimeSeries(points, baseValue = 50, variance = 10) {
  const now = Date.now();
  return Array.from({ length: points }, (_, i) => ({
    timestamp: new Date(now - (points - i) * 60 * 60 * 1000).toISOString(),
    value: baseValue + (Math.random() * variance * 2 - variance)
  }));
}

export { logAnalysisRoutes };