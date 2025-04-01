import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { alertService, AlertSeverity } from '../services/alertService';

// 创建路由
const alertsRouter = new Hono();

/**
 * 获取当前告警
 * GET /api/alerts
 */
alertsRouter.get('/', async (c) => {
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
alertsRouter.delete('/', async (c) => {
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
alertsRouter.post('/check', async (c) => {
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
alertsRouter.post('/test', zValidator('json', z.object({
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

export const alertsRoutes = alertsRouter; 