import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

// Tool to search logs with filters
export const searchLogsTool = createTool({
  id: 'search-logs',
  description: 'Search logs with filters by service, level, time range, and keywords',
  inputSchema: z.object({
    service: z.string().optional().describe('Service name to filter logs'),
    level: z.enum(['error', 'warn', 'info', 'debug', 'all']).optional().default('all'),
    timeRange: z.string().optional().describe('Time range for logs, e.g., "1h", "24h"'),
    keywords: z.array(z.string()).optional().describe('Keywords to search for in logs'),
    limit: z.number().optional().default(100).describe('Maximum number of log entries to return'),
  }),
  execute: async ({ context }) => {
    // In a real implementation, this would query a log database or log aggregation system
    
    // Mock implementation for now with sample logs
    const mockLogs = [
      { timestamp: Date.now() - 3600000, service: 'api-gateway', level: 'error', message: 'Connection refused to auth service' },
      { timestamp: Date.now() - 3400000, service: 'auth-service', level: 'error', message: 'Database connection timeout' },
      { timestamp: Date.now() - 3200000, service: 'auth-service', level: 'info', message: 'Reconnecting to database' },
      { timestamp: Date.now() - 3000000, service: 'auth-service', level: 'info', message: 'Database connection established' },
      { timestamp: Date.now() - 2800000, service: 'api-gateway', level: 'info', message: 'Connection to auth service restored' },
      { timestamp: Date.now() - 2600000, service: 'user-service', level: 'warn', message: 'High latency detected in user requests' },
      { timestamp: Date.now() - 2400000, service: 'user-service', level: 'debug', message: 'Processing user request batch' },
      { timestamp: Date.now() - 2200000, service: 'payment-service', level: 'error', message: 'Payment gateway connection failed' },
      { timestamp: Date.now() - 2000000, service: 'notification-service', level: 'info', message: 'Sending batch notifications' },
      { timestamp: Date.now() - 1800000, service: 'notification-service', level: 'warn', message: 'Notification queue building up' },
    ];

    // Apply filters
    let filteredLogs = [...mockLogs];
    
    if (context.service) {
      filteredLogs = filteredLogs.filter(log => log.service === context.service);
    }
    
    if (context.level && context.level !== 'all') {
      filteredLogs = filteredLogs.filter(log => log.level === context.level);
    }
    
    if (context.keywords && context.keywords.length > 0) {
      filteredLogs = filteredLogs.filter(log => 
        context.keywords!.some(keyword => log.message.toLowerCase().includes(keyword.toLowerCase()))
      );
    }
    
    // Apply limit
    const limit = context.limit || 100;
    filteredLogs = filteredLogs.slice(0, limit);
    
    return {
      logs: filteredLogs,
      count: filteredLogs.length,
      totalCount: mockLogs.length,
    };
  },
});

// Tool to analyze log patterns and detect anomalies
export const analyzeLogPatternsTool = createTool({
  id: 'analyze-log-patterns',
  description: 'Analyze logs to detect patterns and anomalies that might indicate issues',
  inputSchema: z.object({
    logs: z.array(z.object({
      timestamp: z.number(),
      service: z.string(),
      level: z.string(),
      message: z.string(),
    })),
  }),
  execute: async ({ context }) => {
    // In a real implementation, this would use more sophisticated pattern recognition
    
    // Basic implementation for demonstration
    const errorCount = context.logs.filter(log => log.level === 'error').length;
    const warnCount = context.logs.filter(log => log.level === 'warn').length;
    
    const serviceErrors: Record<string, number> = {};
    const serviceGroups: Record<string, typeof context.logs> = {};
    
    // Group logs by service and count errors per service
    context.logs.forEach(log => {
      if (!serviceGroups[log.service]) {
        serviceGroups[log.service] = [];
      }
      serviceGroups[log.service].push(log);
      
      if (log.level === 'error') {
        serviceErrors[log.service] = (serviceErrors[log.service] || 0) + 1;
      }
    });
    
    // Identify services with most errors
    const servicesWithMostErrors = Object.entries(serviceErrors)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([service, count]) => ({ service, count }));
    
    // Look for temporal patterns (errors happening close to each other)
    const timeBasedPatterns = [];
    const sortedLogs = [...context.logs].sort((a, b) => a.timestamp - b.timestamp);
    
    for (let i = 0; i < sortedLogs.length - 1; i++) {
      const currentLog = sortedLogs[i];
      const nextLog = sortedLogs[i + 1];
      
      // If two errors occur within 5 minutes of each other
      if (currentLog.level === 'error' && nextLog.level === 'error' && 
          nextLog.timestamp - currentLog.timestamp < 300000) {
        timeBasedPatterns.push({
          service1: currentLog.service,
          service2: nextLog.service,
          message1: currentLog.message,
          message2: nextLog.message,
          timeDifference: (nextLog.timestamp - currentLog.timestamp) / 1000, // in seconds
        });
      }
    }
    
    return {
      summary: {
        totalLogs: context.logs.length,
        errorCount,
        warnCount,
        infoCount: context.logs.filter(log => log.level === 'info').length,
        debugCount: context.logs.filter(log => log.level === 'debug').length,
      },
      anomalies: {
        servicesWithMostErrors,
        timeBasedPatterns,
      },
      insights: errorCount > context.logs.length * 0.2 ? 
        'High error rate detected, investigate system stability issues' : 
        'System appears to be functioning normally',
    };
  },
});

// Combine all log analysis tools
export const logAnalysisTools = {
  searchLogs: searchLogsTool,
  analyzeLogPatterns: analyzeLogPatternsTool,
}; 