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
import { monitoringRoutes } from './routes/monitoring';
import { logAnalysisRoutes } from './routes/logAnalysis';
import { autoHealingRoutes } from './routes/autoHealing';
// 注释掉不存在的路由，避免启动错误
// import { predictiveRoutes } from './routes/predictive';
// import { dashboardRoutes } from './routes/dashboards';
// import { configRoutes } from './routes/config';
// import { scheduledJobsRoutes } from './routes/scheduledJobs';
// import { notificationsRoutes } from './routes/notifications';
// import { tasksRoutes } from './routes/tasks';
// import { deploysRoutes } from './routes/deploy';
// import { knowledgeRoutes } from './routes/knowledge';
// import { businessMetricsRoutes } from './routes/business-metrics';
// import { analyticsRoutes } from './routes/analytics';
// import { schedulesRoutes } from './routes/schedules';
// import { datasourcesRoutes } from './routes/datasources';

// 导入代理和服务
import { chatAgent } from './agents/chatAgent';
// 注释掉不存在或不需要的代理，避免启动错误
// import { monitoringAgent } from './agents/monitoringAgent';
// import { logAnalysisAgent } from './agents/logAnalysisAgent';
// import { autoHealingAgent } from './agents/autoHealingAgent';
// import { knowledgeBaseAgent } from './agents/knowledgeBaseAgent';
// import { opsAssistant } from './agents/opsAssistant';

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
api.route('/monitoring', monitoringRoutes);
api.route('/log-analysis', logAnalysisRoutes);
api.route('/auto-healing', autoHealingRoutes);
// 注释掉不存在的路由，避免启动错误
// api.route('/predictive', predictiveRoutes);
// api.route('/dashboards', dashboardRoutes);
// api.route('/config', configRoutes);
// api.route('/scheduled-jobs', scheduledJobsRoutes);
// api.route('/notifications', notificationsRoutes);
// api.route('/tasks', tasksRoutes);
// api.route('/deploy', deploysRoutes);
// api.route('/knowledge', knowledgeRoutes);
// api.route('/business-metrics', businessMetricsRoutes);
// api.route('/analytics', analyticsRoutes);
// api.route('/schedules', schedulesRoutes);
// api.route('/datasources', datasourcesRoutes);

// 挂载API到主应用
app.route('/api', api);

// 导出代理实例供其他模块使用
export const agents = {
  chatAgent,
  // 注释掉不存在或不需要的代理，避免启动错误
  // monitoringAgent,
  // logAnalysisAgent,
  // autoHealingAgent,
  // opsAssistant,
};

// 环境变量
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001;

// 服务器初始化
const startServer = async () => {
  try {
    // 创建数据目录
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
      console.log('数据目录创建成功');
    }
    
    // 初始化Redis - 如果失败使用内存缓存
    try {
      await initRedis();
      console.log('Redis 初始化成功');
    } catch (redisError) {
      console.warn('Redis 初始化失败，将使用内存缓存:', redisError);
    }
    
    // 初始化数据服务
    try {
      await initializeDataServices();
      console.log('数据服务初始化成功');
    } catch (dbError) {
      console.error('数据服务初始化失败:', dbError);
    }
    
    // Mastra存储初始化延迟到HTTP服务器启动后，以避免阻塞启动
    console.log('启动 HTTP 服务器...');
    const server = serve({
      fetch: app.fetch,
      port: PORT
    });
    
    console.log(`服务器启动在 http://localhost:${PORT}`);
    
    // 服务器启动后，异步初始化Mastra存储
    initializeMastraStorage().then(initialized => {
      if (initialized) {
        console.log('Mastra存储系统初始化成功，语义搜索可用');
      } else {
        console.warn('Mastra存储初始化失败，将使用基本内存');
      }
    }).catch(error => {
      console.error('Mastra初始化过程中发生错误:', error);
    });
    
    // 数据库迁移也在服务器启动后异步执行
    if (process.env.RUN_MIGRATIONS === 'true') {
      runMigrations().then(() => {
        console.log('数据库迁移完成');
      }).catch(migrationError => {
        console.error('数据库迁移失败:', migrationError);
      });
    }
    
    return server;
  } catch (error) {
    console.error('服务器启动失败:', error);
    process.exit(1);
  }
};

// 启动服务器
startServer(); 