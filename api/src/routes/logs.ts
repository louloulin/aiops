import { Hono } from 'hono';

// 创建日志路由
const logsRoutes = new Hono();

// 获取最新日志
logsRoutes.get('/', (c) => {
  const logs = generateMockLogs(50);
  return c.json({ logs });
});

// 按日志级别过滤
logsRoutes.get('/level/:level', (c) => {
  const level = c.req.param('level');
  const count = parseInt(c.req.query('count') || '20');
  const logs = generateMockLogs(count).filter(log => log.level.toLowerCase() === level.toLowerCase());
  return c.json({ logs });
});

// 按服务名过滤
logsRoutes.get('/service/:service', (c) => {
  const service = c.req.param('service');
  const count = parseInt(c.req.query('count') || '20');
  const logs = generateMockLogs(count).filter(log => log.service.toLowerCase() === service.toLowerCase());
  return c.json({ logs });
});

// 按时间范围搜索
logsRoutes.get('/timerange', (c) => {
  const start = c.req.query('start');
  const end = c.req.query('end');
  const count = parseInt(c.req.query('count') || '20');
  
  let logs = generateMockLogs(count);
  
  if (start) {
    const startDate = new Date(start);
    logs = logs.filter(log => new Date(log.timestamp) >= startDate);
  }
  
  if (end) {
    const endDate = new Date(end);
    logs = logs.filter(log => new Date(log.timestamp) <= endDate);
  }
  
  return c.json({ logs });
});

// 全文搜索
logsRoutes.get('/search', (c) => {
  const query = c.req.query('q');
  const count = parseInt(c.req.query('count') || '20');
  
  if (!query) {
    return c.json({ error: 'Search query is required' }, { status: 400 });
  }
  
  const logs = generateMockLogs(count).filter(log => 
    log.message.toLowerCase().includes(query.toLowerCase()) ||
    log.service.toLowerCase().includes(query.toLowerCase())
  );
  
  return c.json({ logs, query });
});

// 生成模拟日志数据
function generateMockLogs(count = 20) {
  const services = ['api', 'database', 'auth', 'web', 'cache', 'task-queue'];
  const levels = ['INFO', 'WARN', 'ERROR', 'DEBUG'];
  const now = Date.now();
  
  const logs = [];
  
  const generateLogMessage = (service: string, level: string) => {
    switch (level) {
      case 'INFO':
        return `${service} service performing routine operation`;
      case 'WARN':
        return `High resource usage detected in ${service} service`;
      case 'ERROR':
        return `Failed to connect to ${service} service: connection timeout`;
      case 'DEBUG':
        return `Detailed debug information for ${service} operation`;
      default:
        return `Log message for ${service}`;
    }
  };
  
  for (let i = 0; i < count; i++) {
    const service = services[Math.floor(Math.random() * services.length)];
    const level = levels[Math.floor(Math.random() * levels.length)];
    const message = generateLogMessage(service, level);
    
    logs.push({
      id: `log-${i + 1}`,
      timestamp: new Date(now - i * 60000 * (Math.random() * 5)).toISOString(),
      level,
      service,
      message,
      metadata: {
        host: `server-${Math.floor(Math.random() * 5) + 1}`,
        pid: Math.floor(Math.random() * 10000),
        requestId: `req-${Math.random().toString(36).substring(2, 10)}`
      }
    });
  }
  
  return logs;
}

export { logsRoutes };