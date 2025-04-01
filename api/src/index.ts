import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { logger as honoLogger } from 'hono/logger';
import { cors } from 'hono/cors';
import { prettyJSON } from 'hono/pretty-json';
import { serveStatic } from '@hono/node-server/serve-static';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import pino from 'pino';

// 首先加载环境变量，确保api keys可用
dotenv.config();
if (!process.env.QWEN_API_KEY && !process.env.OPENAI_API_KEY) {
  console.warn('\x1b[33m警告: 未设置QWEN_API_KEY或OPENAI_API_KEY环境变量，AI功能将使用模拟响应\x1b[0m');
}

// 导入路由
import { chatRoutes } from './routes/chat';
import { metricsRoutes } from './routes/metrics';
import { logsRoutes } from './routes/logs';
import { alertsRoutes } from './routes/alerts';
// 注释掉不存在的路由，避免启动错误
// import { predictiveRoutes } from './routes/predictive';
// import { dashboardRoutes } from './routes/dashboards';
// import { configRoutes } from './routes/config';
// import { scheduledJobsRoutes } from './routes/scheduledJobs';
// import { notificationsRoutes } from './routes/notifications';
// import { autoHealingRoutes } from './routes/autoHealing';
// import { tasksRoutes } from './routes/tasks';
// import { knowledgeBaseRoutes } from './routes/knowledgeBase';
// import { serverRoutes } from './routes/servers';

// 导入代理和服务
import { chatAgent } from './agents/chatAgent';
import { monitoringAgent } from './agents/monitoringAgent';
import { logAnalysisAgent } from './agents/logAnalysisAgent';
import { autoHealingAgent } from './agents/autoHealingAgent';
// import { knowledgeBaseAgent } from './agents/knowledgeBaseAgent';
import { opsAssistant } from './agents/opsAssistant';

// 导入数据库服务
import { initializeDataServices } from './db';
import runMigrations from './db/migrate';
import { initRedis, isCacheMemory } from './db/redis';

// 导入Mastra服务
import { initializeMastraStorage } from './mastra';

// 配置详细的日志记录
// 创建自定义日志记录器
export const pinoLogger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
    },
  },
});

// 保存原始控制台方法
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleInfo = console.info;

// 替换控制台日志为结构化日志
console.log = function(...args) {
  // 过滤LlamaIndex警告
  if (args.length && typeof args[0] === 'string' && args[0].includes('llamaindex was already imported')) {
    return; // 抑制LlamaIndex警告
  }
  pinoLogger.info(...args);
  originalConsoleLog.apply(console, args);
};

console.error = function(...args) {
  pinoLogger.error(...args);
  originalConsoleError.apply(console, args);
};

console.warn = function(...args) {
  pinoLogger.warn(...args);
  originalConsoleWarn.apply(console, args);
};

console.info = function(...args) {
  pinoLogger.info(...args);
  originalConsoleInfo.apply(console, args);
};

// 创建Hono应用
const app = new Hono();

// 配置中间件
app.use('*', honoLogger());
app.use('*', prettyJSON());
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'Accept'],
  exposeHeaders: ['Content-Length', 'Date', 'X-Request-Id'],
  maxAge: 86400,
  credentials: true,
}));

// 初始化Redis
initRedis().then(() => {
  console.log('Redis 已初始化');
  
  console.log('使用内存缓存:', isCacheMemory());
}).catch((err: Error) => {
  console.error('Redis 初始化失败:', err);
  console.log('将使用内存缓存');
});

// 静态文件服务
const publicDir = path.join(process.cwd(), 'public');
if (fs.existsSync(publicDir)) {
  app.use('/public/*', serveStatic({ root: './' }));
}

// API 路由
const api = new Hono();

// 健康检查端点
api.get('/health', (c) => {
  const redis = isCacheMemory() ? 'memory' : 'redis';
  return c.json({ 
    status: 'ok', 
    services: {
      api: 'online',
      model: 'online',
      cache: redis
    }
  });
});

// 注册可用的路由
api.route('/chat', chatRoutes);
api.route('/metrics', metricsRoutes);
api.route('/logs', logsRoutes);
api.route('/alerts', alertsRoutes);
// 注释掉不存在的路由，避免启动错误
// api.route('/predictive', predictiveRoutes);
// api.route('/dashboards', dashboardRoutes);
// api.route('/config', configRoutes);
// api.route('/scheduled-jobs', scheduledJobsRoutes);
// api.route('/notifications', notificationsRoutes);
// api.route('/auto-healing', autoHealingRoutes);
// api.route('/tasks', tasksRoutes);
// api.route('/knowledge-base', knowledgeBaseRoutes);
// api.route('/servers', serverRoutes);

// 挂载API到主应用
app.route('/api', api);

// 导出代理实例供其他模块使用
export const agents = {
  monitoringAgent,
  logAnalysisAgent,
  autoHealingAgent,
  opsAssistant,
  chatAgent,
};

// 环境变量
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001;

// 服务器初始化
const startServer = async () => {
  try {
    // 初始化Mastra存储
    const mastraInitialized = await initializeMastraStorage();
    if (!mastraInitialized) {
      console.error('Mastra存储初始化失败，使用内存缓存作为备选方案');
    }
    
    // 运行数据库迁移（可选，生产环境可以禁用）
    if (process.env.RUN_MIGRATIONS === 'true') {
      await runMigrations();
    }
    
    // 初始化数据服务
    await initializeDataServices();
    
    // 启动 HTTP 服务器
    console.log(`服务器启动在 http://localhost:${PORT}`);
    
    serve({
      fetch: app.fetch,
      port: PORT
    });
  } catch (error) {
    console.error('服务器启动失败:', error);
    process.exit(1);
  }
};

// 启动服务器
startServer(); 