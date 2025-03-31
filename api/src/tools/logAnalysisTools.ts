import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { generateMockLogs, analyzeLogPatterns, LogQueryParams } from '../services/logs';

/**
 * 搜索日志工具
 * 用于搜索和查询系统日志
 */
export const searchLogsTool = createTool({
  id: 'search-logs',
  description: '搜索和查询系统日志，支持按时间范围、服务和日志级别过滤',
  inputSchema: z.object({
    timeRange: z.enum(['hour', 'day', 'week']).optional().describe('时间范围'),
    service: z.string().optional().describe('服务名称'),
    level: z.enum(['debug', 'info', 'warn', 'error', 'critical']).optional().describe('日志级别'),
    query: z.string().optional().describe('搜索关键词'),
    limit: z.number().optional().describe('返回结果数量限制'),
  }),
  execute: async ({ context }) => {
    const params: LogQueryParams = {
      timeRange: context.timeRange,
      service: context.service,
      level: context.level,
      query: context.query,
      limit: context.limit,
    };
    
    const logs = generateMockLogs(params);
    
    return {
      total: logs.length,
      timeRange: context.timeRange || 'hour',
      logs,
    };
  },
});

/**
 * 分析日志模式工具
 * 用于分析日志中的异常模式和趋势
 */
export const analyzeLogPatternsTool = createTool({
  id: 'analyze-log-patterns',
  description: '分析日志中的异常模式和趋势，识别常见错误和潜在问题',
  inputSchema: z.object({
    timeRange: z.enum(['hour', 'day', 'week']).optional().describe('时间范围'),
    service: z.string().optional().describe('服务名称'),
    threshold: z.number().optional().describe('异常模式识别阈值'),
  }),
  execute: async ({ context }) => {
    const params: LogQueryParams = {
      timeRange: context.timeRange,
      service: context.service,
      limit: 500, // 分析足够多的日志以识别模式
    };
    
    const logs = generateMockLogs(params);
    const analysis = analyzeLogPatterns(logs);
    
    return {
      timeRange: context.timeRange || 'hour',
      service: context.service || 'all',
      totalLogs: logs.length,
      analysis,
    };
  },
});

/**
 * 汇总错误日志工具
 * 用于获取特定时间范围内的错误和关键日志汇总
 */
export const summarizeErrorLogsTool = createTool({
  id: 'summarize-error-logs',
  description: '获取特定时间范围内的错误和关键日志汇总',
  inputSchema: z.object({
    timeRange: z.enum(['hour', 'day', 'week']).optional().describe('时间范围'),
    service: z.string().optional().describe('服务名称'),
  }),
  execute: async ({ context }) => {
    const params: LogQueryParams = {
      timeRange: context.timeRange,
      service: context.service,
      level: 'error', // 只获取错误级别的日志
    };
    
    const errorLogs = generateMockLogs(params);
    
    // 添加关键警告日志
    params.level = 'critical';
    const criticalLogs = generateMockLogs(params);
    
    // 计算错误率
    const allParams: LogQueryParams = {
      timeRange: context.timeRange,
      service: context.service,
    };
    const allLogs = generateMockLogs(allParams);
    const errorRate = (errorLogs.length + criticalLogs.length) / Math.max(allLogs.length, 1);
    
    // 按服务分组错误
    const errorsByService = {} as Record<string, number>;
    [...errorLogs, ...criticalLogs].forEach(log => {
      if (log.service) {
        errorsByService[log.service] = (errorsByService[log.service] || 0) + 1;
      }
    });
    
    // 识别常见错误消息
    const errorMessages = {} as Record<string, number>;
    [...errorLogs, ...criticalLogs].forEach(log => {
      // 简化错误消息以便分组（提取主要错误信息，去除动态部分）
      const simplifiedMessage = log.message
        .replace(/\d+/g, 'X') // 替换数字
        .replace(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/gi, 'UUID') // 替换UUID
        .replace(/[a-f0-9]{16,}/gi, 'HASH'); // 替换哈希值
      
      errorMessages[simplifiedMessage] = (errorMessages[simplifiedMessage] || 0) + 1;
    });
    
    // 排序常见错误消息
    const commonErrors = Object.entries(errorMessages)
      .sort(([_, countA], [__, countB]) => countB - countA)
      .slice(0, 5)
      .map(([message, count]) => ({ message, count }));
    
    return {
      timeRange: context.timeRange || 'hour',
      service: context.service || 'all',
      errorCount: errorLogs.length,
      criticalCount: criticalLogs.length,
      errorRate: errorRate,
      errorsByService,
      commonErrors,
      recentErrors: [...criticalLogs, ...errorLogs]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10),
    };
  },
});

/**
 * 日志分析工具集
 */
export const logAnalysisTools = {
  searchLogs: searchLogsTool,
  analyzeLogPatterns: analyzeLogPatternsTool,
  summarizeErrorLogs: summarizeErrorLogsTool,
}; 