import { config } from 'dotenv';
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { initializeDatabase } from './config/database';
import { metricsRoutes } from './routes/metrics';
import { logsRoutes } from './routes/logs';
import { deployRoutes } from './routes/deploy';
import { knowledgeRoutes } from './routes/knowledge';
import { autohealRoutes } from './routes/autoheal';
import { agentRoutes } from './routes/agent';
import { opsAssistant } from './agents/opsAssistant';
import { monitoringAgent } from './agents/monitoringAgent';
import { logAnalysisAgent } from './agents/logAnalysisAgent';
import { autoHealingAgent } from './agents/autoHealingAgent';
import { knowledgeBaseAgent } from './agents/knowledgeBaseAgent';

// Load environment variables
config();

// Export agents for use in routes
export const agents = {
  opsAssistant,
  monitoringAgent,
  logAnalysisAgent,
  autoHealingAgent,
  knowledgeBaseAgent,
};

const app = new Hono();

// Middleware
app.use('*', logger());
app.use('*', cors());

// Health check route
app.get('/health', (c) => c.json({ status: 'ok' }));

// Register routes
app.route('/api/metrics', metricsRoutes);
app.route('/api/logs', logsRoutes);
app.route('/api/deploy', deployRoutes);
app.route('/api/knowledge', knowledgeRoutes);
app.route('/api/autoheal', autohealRoutes);
app.route('/api/agent', agentRoutes);

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Initialize database and start server
initializeDatabase().then(() => {
  serve({
    fetch: app.fetch,
    port
  });
  console.log(`Server is running on port ${port}`);
}).catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
}); 