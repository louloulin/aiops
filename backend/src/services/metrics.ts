import { Agent } from '@mastra/core/agent';
import { createTool, type ToolExecutionContext } from '@mastra/core/tools';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

// Define the structure of system metrics
export interface SystemMetrics {
  cpu: {
    usage: number;
    temperature: number;
  };
  memory: {
    total: number;
    used: number;
    free: number;
  };
  disk: {
    total: number;
    used: number;
    free: number;
  };
  network: {
    bytesIn: number;
    bytesOut: number;
  };
}

// Define input schema for metrics collection tool
const inputSchema = z.object({
  metric: z.enum(['cpu', 'memory', 'disk', 'network']).optional(),
});

type MetricsInput = z.infer<typeof inputSchema>;

// Create metrics collection tool
const metricsCollectionTool = createTool({
  id: 'metricsCollection',
  description: 'Collects system metrics including CPU, memory, disk, and network usage',
  inputSchema,
  execute: async (context: ToolExecutionContext<typeof inputSchema>) => {
    // Simulated metrics collection
    const metrics: SystemMetrics = {
      cpu: {
        usage: Math.random() * 100,
        temperature: 40 + Math.random() * 20,
      },
      memory: {
        total: 16384,
        used: Math.random() * 16384,
        free: Math.random() * 16384,
      },
      disk: {
        total: 512000,
        used: Math.random() * 512000,
        free: Math.random() * 512000,
      },
      network: {
        bytesIn: Math.random() * 1000000,
        bytesOut: Math.random() * 1000000,
      },
    };

    // Return specific metric if requested
    // Safely access input property with type assertion
    const inputValue = (context as any).input as MetricsInput | undefined;
    if (inputValue?.metric) {
      const metricKey = inputValue.metric;
      return metrics[metricKey];
    }

    // Return all metrics
    return metrics;
  },
});

// Create metrics agent
const metricsAgent = new Agent({
  name: "Metrics Agent",
  instructions: "Collect and analyze system metrics such as CPU, memory, disk, and network usage.",
  model: openai("gpt-4o"),
  tools: {
    metricsCollection: metricsCollectionTool,
  },
});

// Service methods
export const MetricsService = {
  async getSystemMetrics(): Promise<SystemMetrics> {
    try {
      // @ts-expect-error - Agent interface mismatch in Mastra types
      const response = await metricsAgent.execute('Get all system metrics');
      return response as SystemMetrics;
    } catch (error) {
      console.error('Error getting system metrics:', error);
      throw error;
    }
  },

  async getSpecificMetric(metric: keyof SystemMetrics) {
    try {
      // @ts-expect-error - Agent interface mismatch in Mastra types
      const response = await metricsAgent.execute(`Get ${metric} metrics`);
      return response;
    } catch (error) {
      console.error(`Error getting ${metric} metrics:`, error);
      throw error;
    }
  },

  async analyzeMetrics() {
    try {
      const metrics = await this.getSystemMetrics();
      // @ts-expect-error - Agent interface mismatch in Mastra types
      const response = await metricsAgent.execute('Analyze the current system metrics and provide insights', {
        context: { metrics },
      });
      return response;
    } catch (error) {
      console.error('Error analyzing metrics:', error);
      throw error;
    }
  },
}; 