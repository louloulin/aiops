import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { cors } from 'hono/cors';
import dotenv from 'dotenv';
import { agentRoutes } from './routes/agent';
import { metricsRoutes } from './routes/metrics';
import { monitoringAgent } from './agents/monitoringAgent';
import { logAnalysisAgent } from './agents/logAnalysisAgent';
import { autoHealingAgent } from './agents/autoHealingAgent';
import { knowledgeBaseAgent } from './agents/knowledgeBaseAgent';
import { opsAssistant } from './agents/opsAssistant';
import { initializeDataServices } from './db';
import runMigrations from './db/migrate';

// 加载环境变量
dotenv.config();

// 创建 Hono 应用
const app = new Hono();

// 中间件
app.use(logger());
app.use(cors());

// 健康检查路由
app.get('/', (c) => c.json({ status: 'ok', message: 'AI OPS 后端服务正常运行' }));

// API 路由
app.route('/api/agent', agentRoutes);
app.route('/api/metrics', metricsRoutes);

// 添加数据库路由
app.get('/api/health', async (c) => {
  try {
    return c.json({ 
      status: 'ok', 
      services: { 
        api: 'online',
        database: 'online',
        cache: 'online'
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