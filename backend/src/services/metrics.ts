import { Agent } from '@mastra/core/agent';
import { createTool, type ToolExecutionContext } from '@mastra/core/tools';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import { query, getCache, setCache } from '../db';

/**
 * 系统指标接口
 */
export interface SystemMetrics {
  cpu: {
    usage: number;     // CPU使用率 (百分比)
    temperature: number; // CPU温度 (摄氏度)
  };
  memory: {
    total: number;     // 总内存 (MB)
    used: number;      // 已使用内存 (MB)
    free: number;      // 空闲内存 (MB)
  };
  disk: {
    total: number;     // 总磁盘空间 (MB)
    used: number;      // 已使用磁盘空间 (MB)
    free: number;      // 空闲磁盘空间 (MB)
  };
  network: {
    bytesIn: number;   // 入站流量 (bytes)
    bytesOut: number;  // 出站流量 (bytes)
  };
}

/**
 * 保存系统指标到数据库
 * @param metrics 系统指标数据
 * @returns 插入的记录ID
 */
export async function saveMetrics(metrics: SystemMetrics): Promise<number> {
  try {
    // 保存到数据库
    const result = await query(`
      INSERT INTO system_metrics (
        cpu_usage, 
        cpu_temperature, 
        memory_total, 
        memory_used, 
        memory_free, 
        disk_total, 
        disk_used, 
        disk_free, 
        network_bytes_in, 
        network_bytes_out
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id
    `, [
      metrics.cpu.usage,
      metrics.cpu.temperature,
      metrics.memory.total,
      metrics.memory.used,
      metrics.memory.free,
      metrics.disk.total,
      metrics.disk.used,
      metrics.disk.free,
      metrics.network.bytesIn,
      metrics.network.bytesOut
    ]);

    // 缓存最新指标数据
    await setCache('latest_metrics', JSON.stringify(metrics), 300); // 5分钟过期

    return result.rows[0].id;
  } catch (error) {
    console.error('保存系统指标失败:', error);
    throw error;
  }
}

/**
 * 获取最新的系统指标
 * @returns 最新的系统指标数据
 */
export async function getLatestMetrics(): Promise<SystemMetrics | null> {
  try {
    // 尝试从缓存获取
    const cachedMetrics = await getCache('latest_metrics');
    if (cachedMetrics) {
      return JSON.parse(cachedMetrics);
    }

    // 从数据库获取
    const result = await query(`
      SELECT 
        cpu_usage, 
        cpu_temperature, 
        memory_total, 
        memory_used, 
        memory_free, 
        disk_total, 
        disk_used, 
        disk_free, 
        network_bytes_in, 
        network_bytes_out
      FROM system_metrics
      ORDER BY created_at DESC
      LIMIT 1
    `);

    if (result.rows.length === 0) {
      return null;
    }

    const data = result.rows[0];
    const metrics: SystemMetrics = {
      cpu: {
        usage: data.cpu_usage,
        temperature: data.cpu_temperature
      },
      memory: {
        total: data.memory_total,
        used: data.memory_used,
        free: data.memory_free
      },
      disk: {
        total: data.disk_total,
        used: data.disk_used,
        free: data.disk_free
      },
      network: {
        bytesIn: data.network_bytes_in,
        bytesOut: data.network_bytes_out
      }
    };

    // 缓存结果
    await setCache('latest_metrics', JSON.stringify(metrics), 300); // 5分钟过期
    
    return metrics;
  } catch (error) {
    console.error('获取最新系统指标失败:', error);
    return null;
  }
}

/**
 * 获取历史系统指标
 * @param hours 过去几小时的数据
 * @param interval 时间间隔（分钟）
 * @returns 历史系统指标数据
 */
export async function getHistoricalMetrics(hours: number = 24, interval: number = 60): Promise<any[]> {
  try {
    // 构建缓存键
    const cacheKey = `historical_metrics_${hours}_${interval}`;
    
    // 尝试从缓存获取
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      return JSON.parse(cachedData);
    }

    // 从数据库获取数据
    const result = await query(`
      SELECT 
        id,
        cpu_usage, 
        cpu_temperature, 
        memory_total, 
        memory_used, 
        memory_free, 
        disk_total, 
        disk_used, 
        disk_free, 
        network_bytes_in, 
        network_bytes_out,
        created_at
      FROM system_metrics
      WHERE created_at > NOW() - INTERVAL '${hours} hours'
      ORDER BY created_at
      -- 使用窗口函数或其他方法来实现间隔采样
    `);

    // 处理结果，按指定时间间隔分组
    const metrics = result.rows;
    
    // 将结果缓存，设置过期时间为间隔的一半，确保数据相对新鲜
    const expirySeconds = Math.min(interval * 30, 1800); // 最长30分钟
    await setCache(cacheKey, JSON.stringify(metrics), expirySeconds);
    
    return metrics;
  } catch (error) {
    console.error('获取历史系统指标失败:', error);
    return [];
  }
}

/**
 * 获取系统指标统计数据
 * @returns 系统指标统计
 */
export async function getMetricsStats(): Promise<any> {
  try {
    // 缓存键
    const cacheKey = 'metrics_stats';
    
    // 尝试从缓存获取
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      return JSON.parse(cachedData);
    }

    // 从数据库获取统计数据
    const result = await query(`
      SELECT 
        AVG(cpu_usage) as avg_cpu_usage,
        MAX(cpu_usage) as max_cpu_usage,
        AVG(cpu_temperature) as avg_cpu_temperature,
        MAX(cpu_temperature) as max_cpu_temperature,
        AVG(memory_used / memory_total * 100) as avg_memory_usage_percent,
        MAX(memory_used / memory_total * 100) as max_memory_usage_percent,
        AVG(disk_used / disk_total * 100) as avg_disk_usage_percent,
        MAX(disk_used / disk_total * 100) as max_disk_usage_percent,
        AVG(network_bytes_in) as avg_network_in,
        AVG(network_bytes_out) as avg_network_out
      FROM system_metrics
      WHERE created_at > NOW() - INTERVAL '24 hours'
    `);

    const stats = result.rows[0];
    
    // 缓存结果，15分钟过期
    await setCache(cacheKey, JSON.stringify(stats), 900);
    
    return stats;
  } catch (error) {
    console.error('获取系统指标统计失败:', error);
    return null;
  }
}

/**
 * 生成模拟的系统指标数据（用于开发测试）
 * @returns 模拟的系统指标
 */
export function generateMockMetrics(): SystemMetrics {
  // 模拟CPU使用率波动 (10% - 90%)
  const cpuUsage = 10 + Math.random() * 80;
  
  // 模拟CPU温度波动 (30°C - 65°C)
  const cpuTemp = 30 + Math.random() * 35;
  
  // 模拟内存数据
  const memoryTotal = 16384; // 16GB
  const memoryUsed = Math.floor(memoryTotal * (0.3 + Math.random() * 0.5)); // 30%-80%使用率
  const memoryFree = memoryTotal - memoryUsed;
  
  // 模拟磁盘数据
  const diskTotal = 512 * 1024; // 512GB
  const diskUsed = Math.floor(diskTotal * (0.2 + Math.random() * 0.6)); // 20%-80%使用率
  const diskFree = diskTotal - diskUsed;
  
  // 模拟网络数据
  const networkIn = Math.floor(Math.random() * 10 * 1024 * 1024); // 0-10MB
  const networkOut = Math.floor(Math.random() * 5 * 1024 * 1024); // 0-5MB
  
  return {
    cpu: {
      usage: parseFloat(cpuUsage.toFixed(2)),
      temperature: parseFloat(cpuTemp.toFixed(2))
    },
    memory: {
      total: memoryTotal,
      used: memoryUsed,
      free: memoryFree
    },
    disk: {
      total: diskTotal,
      used: diskUsed,
      free: diskFree
    },
    network: {
      bytesIn: networkIn,
      bytesOut: networkOut
    }
  };
}

/**
 * 分析系统指标中的异常
 * @param metrics 系统指标数据
 * @returns 异常列表和健康状态评估
 */
export function analyzeMetrics(metrics: SystemMetrics) {
  const anomalies = [];
  let healthScore = 100;
  
  // CPU 使用率检查
  if (metrics.cpu.usage > 90) {
    anomalies.push({
      component: 'CPU',
      severity: 'high',
      message: `CPU 使用率异常高: ${metrics.cpu.usage.toFixed(2)}%`,
    });
    healthScore -= 30;
  } else if (metrics.cpu.usage > 70) {
    anomalies.push({
      component: 'CPU',
      severity: 'medium',
      message: `CPU 使用率较高: ${metrics.cpu.usage.toFixed(2)}%`,
    });
    healthScore -= 15;
  }
  
  // CPU 温度检查
  if (metrics.cpu.temperature > 55) {
    anomalies.push({
      component: 'CPU',
      severity: 'high',
      message: `CPU 温度异常高: ${metrics.cpu.temperature.toFixed(2)}°C`,
    });
    healthScore -= 25;
  }
  
  // 内存使用检查
  const memoryUsagePercent = (metrics.memory.used / metrics.memory.total) * 100;
  if (memoryUsagePercent > 90) {
    anomalies.push({
      component: 'Memory',
      severity: 'high',
      message: `内存使用率异常高: ${memoryUsagePercent.toFixed(2)}%`,
    });
    healthScore -= 30;
  } else if (memoryUsagePercent > 80) {
    anomalies.push({
      component: 'Memory',
      severity: 'medium',
      message: `内存使用率较高: ${memoryUsagePercent.toFixed(2)}%`,
    });
    healthScore -= 15;
  }
  
  // 磁盘使用检查
  const diskUsagePercent = (metrics.disk.used / metrics.disk.total) * 100;
  if (diskUsagePercent > 90) {
    anomalies.push({
      component: 'Disk',
      severity: 'high',
      message: `磁盘使用率异常高: ${diskUsagePercent.toFixed(2)}%`,
    });
    healthScore -= 25;
  } else if (diskUsagePercent > 80) {
    anomalies.push({
      component: 'Disk',
      severity: 'medium',
      message: `磁盘使用率较高: ${diskUsagePercent.toFixed(2)}%`,
    });
    healthScore -= 10;
  }
  
  return {
    anomalies,
    healthScore: Math.max(0, healthScore),
    timestamp: new Date().toISOString(),
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