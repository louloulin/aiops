import { Hono } from 'hono';
import { metricsRoutes } from './metrics';
import { alertsRoutes } from './alerts';
import datasourcesRoute from './datasources';
import { schedulesRoutes } from './schedules';
import { corsMiddleware } from '../middlewares/cors';

// 创建主路由
const app = new Hono();

// 应用全局中间件
app.use('*', corsMiddleware());

// 注册子路由
app.route('/api/datasources', datasourcesRoute);
app.route('/api/metrics', metricsRoutes);
app.route('/api/alerts', alertsRoutes);
app.route('/api/schedules', schedulesRoutes);

// 健康检查
app.get('/api/health', (c) => {
  return c.json({
    status: 'ok',
    services: {
      api: 'online',
      database: 'online',
      monitoring: 'online'
    },
    timestamp: new Date().toISOString()
  });
});

export const routes = app; 