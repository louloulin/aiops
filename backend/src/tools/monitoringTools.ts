import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { generateMockMetrics, analyzeMetrics, getHistoricalMetrics } from "../services/metrics";

/**
 * 获取系统指标工具
 * 用于获取当前系统的运行指标数据
 */
export const getSystemMetricsTool = createTool({
  id: 'get-system-metrics',
  description: '获取当前系统的运行指标数据，包括CPU、内存、磁盘和网络使用情况',
  inputSchema: z.object({
    detailed: z.boolean().optional().describe('是否返回详细信息'),
  }),
  execute: async ({ context }) => {
    const detailed = context.detailed || false;
    const metrics = generateMockMetrics();
    
    if (detailed) {
      const analysis = analyzeMetrics(metrics);
      return {
        metrics,
        analysis,
      };
    }
    
    return { metrics };
  },
});

/**
 * 获取历史指标工具
 * 用于查询系统的历史运行指标数据
 */
export const getHistoricalMetricsTool = createTool({
  id: 'get-historical-metrics',
  description: '获取系统的历史运行指标数据，可按时间范围查询',
  inputSchema: z.object({
    timeRange: z.enum(['hour', 'day', 'week']).describe('时间范围'),
    limit: z.number().optional().describe('返回数据点数量'),
  }),
  execute: async ({ context }) => {
    const timeRange = context.timeRange || 'hour';
    const limit = context.limit || 10;
    
    const historicalData = getHistoricalMetrics(timeRange, limit);
    
    return {
      timeRange,
      dataPoints: historicalData.length,
      historicalData,
    };
  },
});

/**
 * 设置告警阈值工具
 * 用于配置系统指标的告警阈值
 */
export const setAlertThresholdTool = createTool({
  id: 'set-alert-threshold',
  description: '设置系统指标的告警阈值，超过阈值将触发告警',
  inputSchema: z.object({
    metric: z.enum(['cpu_usage', 'cpu_temperature', 'memory_usage', 'disk_usage', 'network_traffic']).describe('指标类型'),
    threshold: z.number().describe('告警阈值'),
    severity: z.enum(['low', 'medium', 'high', 'critical']).describe('告警级别'),
  }),
  execute: async ({ context }) => {
    // 在实际项目中，这里会将告警阈值保存到数据库或配置系统
    const { metric, threshold, severity } = context;
    
    // 模拟保存阈值
    const alertConfig = {
      metric,
      threshold,
      severity,
      createdAt: new Date().toISOString(),
    };
    
    return {
      success: true,
      message: `已成功为 ${metric} 设置 ${severity} 级别的告警阈值: ${threshold}`,
      config: alertConfig,
    };
  },
});

/**
 * 检查系统健康状态工具
 * 用于快速检查系统的整体健康状态
 */
export const checkSystemHealthTool = createTool({
  id: "check-system-health",
  description: "检查系统的整体健康状态，评估系统是否正常运行",
  inputSchema: z.object({
    deep: z.boolean().optional().describe("是否进行深度检查"),
  }),
  execute: async ({ context }) => {
    const deep = context.deep || false;
    const metrics = generateMockMetrics();
    const analysis = analyzeMetrics(metrics);
    
    // 简化的健康检查逻辑
    let status = "healthy";
    if (analysis.healthScore < 50) {
      status = "critical";
    } else if (analysis.healthScore < 70) {
      status = "unhealthy";
    } else if (analysis.healthScore < 90) {
      status = "warning";
    }
    
    if (deep) {
      // 在实际项目中，深度检查会执行更多的系统检查
      return {
        status,
        healthScore: analysis.healthScore,
        anomalies: analysis.anomalies,
        details: {
          cpu: {
            status: metrics.cpu.usage > 90 ? "critical" : 
                   metrics.cpu.usage > 70 ? "warning" : "healthy",
            usage: metrics.cpu.usage,
            temperature: metrics.cpu.temperature,
          },
          memory: {
            status: (metrics.memory.used / metrics.memory.total) > 0.9 ? "critical" :
                   (metrics.memory.used / metrics.memory.total) > 0.7 ? "warning" : "healthy",
            used: metrics.memory.used,
            total: metrics.memory.total,
          },
          disk: {
            status: (metrics.disk.used / metrics.disk.total) > 0.9 ? "critical" :
                   (metrics.disk.used / metrics.disk.total) > 0.7 ? "warning" : "healthy",
            used: metrics.disk.used,
            total: metrics.disk.total,
          },
          network: {
            status: "healthy", // 简化示例，实际中可能有更复杂的网络健康判断
            bytesIn: metrics.network.bytesIn,
            bytesOut: metrics.network.bytesOut,
          },
        },
      };
    }
    
    return {
      status,
      healthScore: analysis.healthScore,
      anomalies: analysis.anomalies.length,
      timestamp: new Date().toISOString(),
    };
  },
});

/**
 * 监控工具集
 */
export const monitoringTools = {
  getSystemMetrics: getSystemMetricsTool,
  getHistoricalMetrics: getHistoricalMetricsTool,
  setAlertThreshold: setAlertThresholdTool,
  checkSystemHealth: checkSystemHealthTool,
}; 