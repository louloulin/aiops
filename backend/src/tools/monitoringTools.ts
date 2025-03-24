import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

// Tool to fetch system metrics
export const fetchMetricsTool = createTool({
  id: 'fetch-metrics',
  description: 'Fetch system metrics such as CPU, memory, disk, and network usage',
  inputSchema: z.object({
    metricType: z.enum(['cpu', 'memory', 'disk', 'network', 'all']),
    timeRange: z.string().optional().describe('Time range for metrics, e.g., "1h", "24h"'),
    interval: z.string().optional().describe('Aggregation interval, e.g., "1m", "5m"'),
  }),
  execute: async ({ context }) => {
    // In a real implementation, this would connect to Prometheus, Grafana,
    // or other monitoring systems to fetch actual metrics
    
    // Mock implementation for now
    const mockMetrics = {
      cpu: [
        { timestamp: Date.now() - 3600000, value: 45 },
        { timestamp: Date.now() - 1800000, value: 65 },
        { timestamp: Date.now() - 600000, value: 55 },
        { timestamp: Date.now(), value: 70 },
      ],
      memory: [
        { timestamp: Date.now() - 3600000, value: 65 },
        { timestamp: Date.now() - 1800000, value: 70 },
        { timestamp: Date.now() - 600000, value: 75 },
        { timestamp: Date.now(), value: 80 },
      ],
      disk: [
        { timestamp: Date.now() - 3600000, value: 50 },
        { timestamp: Date.now() - 1800000, value: 52 },
        { timestamp: Date.now() - 600000, value: 54 },
        { timestamp: Date.now(), value: 55 },
      ],
      network: [
        { timestamp: Date.now() - 3600000, value: 30 },
        { timestamp: Date.now() - 1800000, value: 40 },
        { timestamp: Date.now() - 600000, value: 35 },
        { timestamp: Date.now(), value: 45 },
      ],
    };

    if (context.metricType === 'all') {
      return mockMetrics;
    }

    return {
      [context.metricType]: mockMetrics[context.metricType],
    };
  },
});

// Tool to detect anomalies in metrics
export const detectAnomaliesTools = createTool({
  id: 'detect-anomalies',
  description: 'Analyze metrics and detect anomalies based on patterns and thresholds',
  inputSchema: z.object({
    metrics: z.record(z.string(), z.array(z.object({
      timestamp: z.number(),
      value: z.number(),
    }))),
    thresholds: z.record(z.string(), z.number()).optional(),
  }),
  execute: async ({ context }) => {
    // In a real implementation, this would use statistical analysis or ML
    // to detect anomalies in the metrics
    
    // Simple threshold-based detection for now
    const defaultThresholds: Record<string, number> = {
      cpu: 80,
      memory: 85,
      disk: 90,
      network: 75,
    };

    const thresholds: Record<string, number> = context.thresholds || defaultThresholds;
    const anomalies = [];

    for (const [metricName, metricValues] of Object.entries(context.metrics)) {
      const threshold = thresholds[metricName] || 75;
      const latestValue = metricValues[metricValues.length - 1].value;
      
      if (latestValue > threshold) {
        anomalies.push({
          metricName,
          value: latestValue,
          threshold,
          timestamp: metricValues[metricValues.length - 1].timestamp,
          severity: latestValue > threshold + 10 ? 'critical' : 'warning',
        });
      }
    }

    return {
      anomaliesDetected: anomalies.length > 0,
      anomalies,
    };
  },
});

// Combine all monitoring tools
export const monitoringTools = {
  fetchMetrics: fetchMetricsTool,
  detectAnomalies: detectAnomaliesTools,
}; 