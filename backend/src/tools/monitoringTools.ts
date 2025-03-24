import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

/**
 * 获取系统指标工具
 * 用于获取系统的CPU、内存、磁盘和网络使用情况
 */
export const getSystemMetricsTool = createTool({
  id: 'get-system-metrics',
  description: '获取系统的CPU、内存、磁盘和网络使用情况',
  inputSchema: z.object({
    timeRange: z.string().optional().describe('时间范围，如 \'5m\'、\'1h\'、\'1d\''),
    serviceId: z.string().optional().describe('服务ID，用于获取特定服务的指标'),
  }),
  execute: async ({ context }) => {
    // 模拟数据
    const cpuUsage = Math.random() * 100;
    const memoryUsage = Math.random() * 100;
    const diskUsage = Math.random() * 100;
    
    // 根据CPU使用率判断状态
    let status = '健康';
    if (cpuUsage > 90) {
      status = '严重';
    } else if (cpuUsage > 70) {
      status = '警告';
    }
    
    return {
      timestamp: new Date().toISOString(),
      service: context.serviceId || '全局',
      status,
      metrics: {
        cpu: {
          usage: cpuUsage.toFixed(2) + '%',
          cores: 8,
          temperature: (40 + Math.random() * 20).toFixed(1) + '°C',
        },
        memory: {
          total: '16GB',
          used: (memoryUsage / 100 * 16).toFixed(2) + 'GB',
          free: (16 - memoryUsage / 100 * 16).toFixed(2) + 'GB',
          percentage: memoryUsage.toFixed(2) + '%',
        },
        disk: {
          total: '500GB',
          used: (diskUsage / 100 * 500).toFixed(2) + 'GB',
          free: (500 - diskUsage / 100 * 500).toFixed(2) + 'GB',
          percentage: diskUsage.toFixed(2) + '%',
        },
        network: {
          bytesIn: Math.floor(Math.random() * 1000) + 'KB/s',
          bytesOut: Math.floor(Math.random() * 1000) + 'KB/s',
        },
      }
    };
  },
});

/**
 * 设置告警阈值工具
 * 用于设置系统指标的告警阈值
 */
export const setAlertThresholdTool = createTool({
  id: 'set-alert-threshold',
  description: '设置系统指标的告警阈值',
  inputSchema: z.object({
    metricType: z.enum(['cpu', 'memory', 'disk', 'network']).describe('指标类型'),
    warningThreshold: z.number().describe('警告阈值'),
    criticalThreshold: z.number().describe('严重阈值'),
    serviceId: z.string().optional().describe('服务ID，用于设置特定服务的阈值'),
  }),
  execute: async ({ context }) => {
    return {
      success: true,
      message: `已为${context.serviceId || '全局'}设置${context.metricType}指标的告警阈值：警告阈值=${context.warningThreshold}%，严重阈值=${context.criticalThreshold}%`,
      thresholds: {
        metricType: context.metricType,
        warningThreshold: context.warningThreshold,
        criticalThreshold: context.criticalThreshold,
        serviceId: context.serviceId || '全局',
      }
    };
  },
});

/**
 * 监控工具集
 */
export const monitoringTools = {
  getSystemMetrics: getSystemMetricsTool,
  setAlertThreshold: setAlertThresholdTool,
}; 