import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { alertService, AlertSeverity } from '../services/alertService';

// 创建告警路由
const alertsRoutes = new Hono();

/**
 * 获取当前告警
 * GET /api/alerts
 */
alertsRoutes.get('/', async (c) => {
  try {
    // 获取查询参数
    const query = c.req.query();
    
    // 获取告警列表
    let alerts = alertService.getAlerts();
    
    // 根据严重性过滤
    if (query.severity) {
      const severities = query.severity.split(',');
      alerts = alerts.filter(alert => severities.includes(alert.severity));
    }
    
    // 根据来源过滤
    if (query.source) {
      const sources = query.source.split(',');
      alerts = alerts.filter(alert => sources.includes(alert.source));
    }
    
    // 根据指标类型过滤
    if (query.metric) {
      const metrics = query.metric.split(',');
      alerts = alerts.filter(alert => metrics.includes(alert.metric));
    }
    
    // 默认按时间倒序排序
    alerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return c.json({
      success: true,
      count: alerts.length,
      alerts
    });
  } catch (error) {
    console.error('获取告警失败:', error);
    return c.json({ success: false, message: '获取告警失败' }, 500);
  }
});

/**
 * 清除所有告警
 * DELETE /api/alerts
 */
alertsRoutes.delete('/', async (c) => {
  try {
    alertService.clearAlerts();
    return c.json({ success: true, message: '所有告警已清除' });
  } catch (error) {
    console.error('清除告警失败:', error);
    return c.json({ success: false, message: '清除告警失败' }, 500);
  }
});

/**
 * 手动触发告警检查
 * POST /api/alerts/check
 */
alertsRoutes.post('/check', async (c) => {
  try {
    const alerts = await alertService.checkLatestMetrics();
    return c.json({
      success: true,
      alertsGenerated: alerts.length,
      alerts
    });
  } catch (error) {
    console.error('手动检查告警失败:', error);
    return c.json({ success: false, message: '手动检查告警失败' }, 500);
  }
});

/**
 * 创建测试告警（用于测试告警系统）
 * POST /api/alerts/test
 */
alertsRoutes.post('/test', zValidator('json', z.object({
  source: z.string().default('test'),
  metric: z.string().default('test_metric'),
  value: z.number().default(100),
  threshold: z.number().default(80),
  severity: z.enum([
    AlertSeverity.INFO,
    AlertSeverity.WARNING,
    AlertSeverity.CRITICAL
  ]).default(AlertSeverity.WARNING),
  message: z.string().optional(),
})), async (c) => {
  try {
    const { source, metric, value, threshold, severity } = c.req.valid('json');
    
    const testAlert = {
      id: `test-${Date.now()}`,
      timestamp: new Date(),
      severity,
      source,
      metric,
      value,
      threshold,
      message: c.req.valid('json').message || `测试告警: ${source} ${metric} = ${value}`
    };
    
    alertService.getAlerts().unshift(testAlert);
    
    return c.json({
      success: true,
      message: '测试告警已创建',
      alert: testAlert
    });
  } catch (error) {
    console.error('创建测试告警失败:', error);
    return c.json({ success: false, message: '创建测试告警失败' }, 500);
  }
});

// 获取所有告警
alertsRoutes.get('/', (c) => {
  const alerts = generateMockAlerts(20);
  return c.json({ alerts });
});

// 按严重程度获取告警
alertsRoutes.get('/severity/:severity', (c) => {
  const severity = c.req.param('severity');
  const alerts = generateMockAlerts(20).filter(
    alert => alert.severity.toLowerCase() === severity.toLowerCase()
  );
  return c.json({ alerts });
});

// 按状态获取告警
alertsRoutes.get('/status/:status', (c) => {
  const status = c.req.param('status');
  const alerts = generateMockAlerts(20).filter(
    alert => alert.status.toLowerCase() === status.toLowerCase()
  );
  return c.json({ alerts });
});

// 获取告警详情
alertsRoutes.get('/:id', (c) => {
  const id = c.req.param('id');
  const alert = generateMockAlerts(1).find(a => a.id === id) || generateMockAlerts(1)[0];
  alert.id = id; // 确保返回的是请求的ID
  return c.json({ alert });
});

// 更新告警状态
alertsRoutes.put('/:id/status', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const status = body.status;
  
  if (!['open', 'acknowledged', 'resolved'].includes(status)) {
    return c.json({ error: 'Invalid status' }, { status: 400 });
  }
  
  // 在实际应用中，这里会更新数据库
  return c.json({
    success: true,
    message: `Alert ${id} status updated to ${status}`,
    alert: {
      id,
      status,
      updated_at: new Date().toISOString()
    }
  });
});

// 生成模拟告警数据
function generateMockAlerts(count = 10) {
  const services = ['api', 'database', 'auth', 'web', 'cache', 'task-queue'];
  const severities = ['critical', 'high', 'medium', 'low'];
  const statuses = ['open', 'acknowledged', 'resolved'];
  const alertTypes = [
    'High CPU Usage', 
    'Memory Leak', 
    'Disk Space Low', 
    'API Latency High', 
    'Database Connection Failure',
    'Service Unavailable',
    'Rate Limit Exceeded'
  ];
  
  const now = Date.now();
  const alerts = [];
  
  for (let i = 0; i < count; i++) {
    const service = services[Math.floor(Math.random() * services.length)];
    const severity = severities[Math.floor(Math.random() * severities.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const alertType = alertTypes[Math.floor(Math.random() * alertTypes.length)];
    
    // 生成告警描述
    const description = `${alertType} detected in ${service} service`;
    
    // 创建模拟告警
    alerts.push({
      id: `alert-${Math.random().toString(36).substring(2, 10)}`,
      title: alertType,
      description,
      service,
      severity,
      status,
      created_at: new Date(now - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)).toISOString(),
      updated_at: new Date(now - Math.floor(Math.random() * 2 * 24 * 60 * 60 * 1000)).toISOString(),
      metadata: {
        source: `${service}-monitor`,
        affected_resource: `${service}-${Math.floor(Math.random() * 5) + 1}`,
        threshold: severity === 'critical' ? 95 : severity === 'high' ? 85 : severity === 'medium' ? 75 : 65,
        current_value: Math.floor(Math.random() * 100)
      }
    });
  }
  
  return alerts;
}

export { alertsRoutes }; 