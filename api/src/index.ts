// Filter out LlamaIndex warnings
const originalConsoleLog = console.log;
console.log = function(...args) {
  if (args.length && typeof args[0] === 'string' && args[0].includes('llamaindex was already imported')) {
    return; // Suppress LlamaIndex warnings
  }
  originalConsoleLog.apply(console, args);
};

import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { cors } from 'hono/cors';
import dotenv from 'dotenv';
import { agentRoutes } from './routes/agent';
import { metricsRoutes } from './routes/metrics';
import { logsRoutes } from './routes/logs';
import { deployRoutes } from './routes/deploy';
import { autohealRoutes } from './routes/autoheal';
import { knowledgeRoutes } from './routes/knowledge';
import businessMetricsRoutes from './routes/business-metrics';
import datasourcesRoutes from './routes/datasources';
import { alertsRoutes } from './routes/alerts';
import { schedulesRoutes } from './routes/schedules';
import { monitoringAgent } from './agents/monitoringAgent';
import { logAnalysisAgent } from './agents/logAnalysisAgent';
import { autoHealingAgent } from './agents/autoHealingAgent';
import { knowledgeBaseAgent } from './agents/knowledgeBaseAgent';
import { opsAssistant } from './agents/opsAssistant';
import { initializeDataServices } from './db';
import runMigrations from './db/migrate';
import tasksRoutes from './routes/tasks';
import analyticsRoutes from './routes/analytics';
import { isCacheMemory } from './db/redis';

// 加载环境变量
dotenv.config();

// 创建 Hono 应用
const app = new Hono();

// 中间件
app.use(logger());
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176', 'http://localhost:5177', 'http://localhost:7400'],
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  exposeHeaders: ['Content-Length', 'Content-Type'],
  credentials: true,
  maxAge: 86400,
}));

// 健康检查路由
app.get('/', (c) => c.json({ status: 'ok', message: 'AI OPS API服务正常运行' }));

// API 路由
app.route('/api/agent', agentRoutes);
app.route('/api/metrics', metricsRoutes);
app.route('/api/logs', logsRoutes);
app.route('/api/deploy', deployRoutes);
app.route('/api/autoheal', autohealRoutes);
app.route('/api/knowledge', knowledgeRoutes);
app.route('/api/business-metrics', businessMetricsRoutes);
app.route('/api/datasources', datasourcesRoutes);
app.route('/api/alerts', alertsRoutes);
app.route('/api/schedules', schedulesRoutes);
app.route('/api/tasks', tasksRoutes);
app.route('/api/analytics', analyticsRoutes);

// 添加数据库路由
app.get('/api/health', async (c) => {
  try {
    const cacheType = await isCacheMemory() ? 'memory' : 'redis';
    
    return c.json({ 
      status: 'ok', 
      services: { 
        api: 'online',
        database: 'online',
        cache: {
          status: 'online',
          type: cacheType
        }
      } 
    });
  } catch (error) {
    console.error('健康检查错误:', error);
    return c.json({ 
      status: 'error', 
      message: '服务健康检查失败',
      error: error instanceof Error ? error.message : String(error)
    }, 500);
  }
});

// 导出代理实例供其他模块使用
export const agents = {
  monitoringAgent,
  logAnalysisAgent,
  autoHealingAgent,
  knowledgeBaseAgent,
  opsAssistant,
};

// 服务器初始化
const startServer = async () => {
  try {
    // 运行数据库迁移（可选，生产环境可以禁用）
    if (process.env.RUN_MIGRATIONS === 'true') {
      await runMigrations();
    }
    
    // 初始化数据服务
    await initializeDataServices();
    
    // 启动 HTTP 服务器
    const port = parseInt(process.env.PORT || '3000');
    
    console.log(`服务器启动在 http://localhost:${port}`);
    serve({
      fetch: app.fetch,
      port
    });
  } catch (error) {
    console.error('服务器启动失败:', error);
    process.exit(1);
  }
};

// 启动服务器
startServer(); 