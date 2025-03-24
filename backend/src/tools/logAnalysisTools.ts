import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

/**
 * 查询日志工具
 * 用于从日志系统中查询和过滤日志
 */
export const queryLogsTool = createTool({
  id: 'query-logs',
  description: '从日志系统中查询和过滤日志',
  inputSchema: z.object({
    timeRange: z.string().optional().describe('时间范围，如 \'5m\'、\'1h\'、\'1d\''),
    service: z.string().optional().describe('服务名称'),
    level: z.enum(['debug', 'info', 'warn', 'error', 'critical']).optional().describe('日志级别'),
    query: z.string().optional().describe('搜索查询'),
    limit: z.number().optional().describe('返回的日志条数限制'),
  }),
  execute: async ({ context }) => {
    // 模拟数据
    const levels = ['debug', 'info', 'warn', 'error', 'critical'];
    const services = ['api-gateway', 'auth-service', 'user-service', 'product-service', 'order-service'];
    const messagePrefixes = [
      'Started', 'Completed', 'Failed to', 'Processing', 'Received', 'Sent', 'Connected to',
      'Disconnected from', 'Initialized', 'Terminated', 'Validated', 'Rejected', 'Approved',
    ];
    const messageObjects = ['request', 'response', 'transaction', 'connection', 'session', 'job', 'task', 'process'];
    
    const limit = context.limit || 10;
    
    const logs = Array.from({ length: limit }, (_, i) => {
      const level = context.level || levels[Math.floor(Math.random() * levels.length)];
      const service = context.service || services[Math.floor(Math.random() * services.length)];
      const prefix = messagePrefixes[Math.floor(Math.random() * messagePrefixes.length)];
      const object = messageObjects[Math.floor(Math.random() * messageObjects.length)];
      const timestamp = new Date(Date.now() - i * 60000).toISOString();
      
      return {
        id: `log-${Date.now()}-${i}`,
        timestamp,
        level,
        service,
        message: `${prefix} ${object} ${i}`,
        context: {
          requestId: `req-${Math.random().toString(36).substring(2, 9)}`,
          userId: Math.floor(Math.random() * 1000),
          duration: Math.floor(Math.random() * 1000),
        }
      };
    });
    
    return {
      logs,
      count: logs.length,
      query: context.query || '',
      timeRange: context.timeRange || '15m',
    };
  },
});

/**
 * 分析日志模式工具
 * 用于分析日志中的模式和趋势
 */
export const analyzeLogPatternsTool = createTool({
  id: 'analyze-log-patterns',
  description: '分析日志中的模式和趋势',
  inputSchema: z.object({
    logs: z.array(z.object({
      id: z.string(),
      timestamp: z.string(),
      level: z.string(),
      service: z.string(),
      message: z.string(),
      context: z.record(z.string(), z.any()).optional(),
    })),
  }),
  execute: async ({ context }) => {
    // 模拟日志分析结果
    const logs = context.logs;
    const errorCount = logs.filter(log => log.level === 'error' || log.level === 'critical').length;
    const warnCount = logs.filter(log => log.level === 'warn').length;
    
    // 按服务分组
    const serviceGroups: Record<string, number> = {};
    logs.forEach(log => {
      if (!serviceGroups[log.service]) {
        serviceGroups[log.service] = 0;
      }
      serviceGroups[log.service]++;
    });
    
    // 模拟找出模式
    const patterns = [
      {
        name: '错误率升高',
        description: '错误日志比例超过10%',
        severity: errorCount / logs.length > 0.1 ? '高' : '低',
        count: errorCount,
      },
      {
        name: '警告聚集',
        description: '短时间内出现多个警告日志',
        severity: warnCount > 3 ? '中' : '低',
        count: warnCount,
      },
    ];
    
    return {
      patterns,
      errorRate: errorCount / logs.length,
      serviceDistribution: serviceGroups,
      timespan: {
        start: logs[logs.length - 1]?.timestamp,
        end: logs[0]?.timestamp,
      },
    };
  },
});

/**
 * 日志分析工具集
 */
export const logAnalysisTools = {
  queryLogs: queryLogsTool,
  analyzeLogPatterns: analyzeLogPatternsTool,
}; 