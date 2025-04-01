import { Agent } from "@mastra/core/agent";
import { qw, PROMPTS, PROMPT_TYPES, memory } from "../mastra";
import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { db } from "../db/drizzle";
import * as schema from "../db/schema";

/**
 * 监控分析结果接口
 */
export interface MonitoringAnalysisResult {
  anomalies: Array<{
    component: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
  }>;
  healthScore: number;
  insights: string[];
  recommendations: string[];
  timestamp: string;
}

// 创建获取系统指标工具
const getSystemMetricsTool = createTool({
  id: "get-system-metrics",
  description: "获取系统指标数据，包括CPU、内存、磁盘和网络使用情况",
  inputSchema: z.object({
    timeRange: z.string().optional().describe("时间范围，例如: '1h', '1d', '7d'"),
    limit: z.number().optional().default(10).describe("返回的指标数量"),
  }),
  execute: async ({ context }) => {
    try {
      // 默认返回最新的10条记录
      const limit = context.limit || 10;
      
      // 查询系统指标数据 - 使用原生SQL查询避免类型问题
      const result = await db.query.systemMetrics.findMany({
        limit,
        orderBy: (metrics, { desc }) => [desc(metrics.createdAt)]
      });
      
      return {
        success: true,
        metrics: result,
        count: result.length,
      };
    } catch (error) {
      console.error("获取系统指标失败:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
});

// 创建分析系统指标工具
const analyzeSystemMetricsTool = createTool({
  id: "analyze-system-metrics",
  description: "分析系统指标，检测异常和性能问题",
  inputSchema: z.object({
    timeRange: z.string().optional().describe("时间范围，例如: '1h', '1d', '7d'"),
    metrics: z.array(
      z.object({
        id: z.number(),
        cpuUsage: z.number(),
        memoryUsed: z.number(),
        memoryTotal: z.number(),
        diskUsed: z.number(), 
        diskTotal: z.number(),
        createdAt: z.string().or(z.date()),
      })
    ).optional().describe("要分析的指标数据，如不提供则自动获取"),
  }),
  execute: async ({ context }) => {
    try {
      let metricsData = context.metrics;
      
      // 如果没有提供指标数据，则直接查询数据库
      if (!metricsData || metricsData.length === 0) {
        metricsData = await db.query.systemMetrics.findMany({
          limit: 20,
          orderBy: (metrics, { desc }) => [desc(metrics.createdAt)]
        });
        
        if (!metricsData || metricsData.length === 0) {
          return {
            success: false,
            error: "获取系统指标失败，没有可用数据",
          };
        }
      }
      
      // 计算平均值
      const averageCpuUsage = metricsData.reduce((sum, metric) => sum + metric.cpuUsage, 0) / metricsData.length;
      const averageMemoryUsage = metricsData.reduce((sum, metric) => 
        sum + (metric.memoryUsed / metric.memoryTotal * 100), 0) / metricsData.length;
      const averageDiskUsage = metricsData.reduce((sum, metric) => 
        sum + (metric.diskUsed / metric.diskTotal * 100), 0) / metricsData.length;
      
      // 检测异常
      const anomalies = [];
      const cpuThreshold = 80;
      const memoryThreshold = 85;
      const diskThreshold = 90;
      
      if (averageCpuUsage > cpuThreshold) {
        anomalies.push(`CPU使用率异常: ${averageCpuUsage.toFixed(2)}%`);
      }
      
      if (averageMemoryUsage > memoryThreshold) {
        anomalies.push(`内存使用率异常: ${averageMemoryUsage.toFixed(2)}%`);
      }
      
      if (averageDiskUsage > diskThreshold) {
        anomalies.push(`磁盘使用率异常: ${averageDiskUsage.toFixed(2)}%`);
      }
      
      return {
        success: true,
        metrics: {
          averageCpuUsage: averageCpuUsage.toFixed(2),
          averageMemoryUsage: averageMemoryUsage.toFixed(2),
          averageDiskUsage: averageDiskUsage.toFixed(2),
        },
        anomalies: anomalies,
        hasAnomalies: anomalies.length > 0,
        recommendedActions: anomalies.length > 0 
          ? ["检查高负载进程", "考虑扩展资源", "优化应用性能"] 
          : []
      };
    } catch (error) {
      console.error("分析系统指标失败:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
});

// 创建监控代理
export const monitoringAgent = new Agent({
  name: "Monitoring Agent",
  instructions: PROMPTS[PROMPT_TYPES.MONITORING],
  model: qw,
  tools: {
    getSystemMetrics: getSystemMetricsTool,
    analyzeSystemMetrics: analyzeSystemMetricsTool,
  },
  memory,
});

// 导出监控工具供其他模块使用
export const monitoringTools = {
  getSystemMetrics: getSystemMetricsTool,
  analyzeSystemMetrics: analyzeSystemMetricsTool,
};

/**
 * 分析系统指标数据
 * @param metrics 系统指标数据
 * @param sessionId 可选的会话ID，用于保持上下文连续性
 * @returns 分析结果，包括异常、健康分数和建议
 */
export async function analyzeSystemMetrics(metrics: any, sessionId?: string): Promise<MonitoringAnalysisResult> {
  // 生成唯一的会话ID，如果未提供
  const threadId = sessionId || `monitoring_${Date.now()}`;
  
  // 格式化指标数据为文本描述
  const metricsDescription = `
    系统当前状态：
    - CPU：使用率 ${metrics.cpu.usage.toFixed(2)}%，温度 ${metrics.cpu.temperature.toFixed(2)}°C
    - 内存：总计 ${metrics.memory.total}MB，已使用 ${metrics.memory.used.toFixed(2)}MB，空闲 ${metrics.memory.free.toFixed(2)}MB
    - 磁盘：总计 ${metrics.disk.total}MB，已使用 ${metrics.disk.used.toFixed(2)}MB，空闲 ${metrics.disk.free.toFixed(2)}MB
    - 网络：入站流量 ${metrics.network.bytesIn.toFixed(2)}bytes，出站流量 ${metrics.network.bytesOut.toFixed(2)}bytes
  `;

  // 配置内存选项
  const memoryOptions = {
    lastMessages: 5,           // 保留最近的5条消息
    semanticRecall: {
      enabled: false,          // 禁用语义搜索，避免嵌入错误
      // topK: 3,              // 检索最相关的3条历史记录
      // messageRange: 1,      // 每个相关消息的上下文窗口
    },
    workingMemory: { enabled: true },
  };

  // 使用监控代理分析数据
  const response = await monitoringAgent.generate([
    { 
      role: "system", 
      content: "你是一个系统监控分析专家。请分析以下系统指标数据，识别异常，评估系统健康状况，并提供优化建议。"
    },
    { 
      role: "user", 
      content: `请分析以下系统指标数据并提供详细报告：\n${metricsDescription}`
    }
  ], {
    resourceId: `system_metrics_${threadId}`,
    threadId: threadId,
    memoryOptions,
  });

  // 处理代理响应，提取分析结果
  const analysisText = typeof response === 'string' ? response : response.text;
  
  // 简单的异常检测逻辑
  const anomalies = [];
  
  if (metrics.cpu.usage > 90) {
    anomalies.push({
      component: 'CPU',
      severity: 'high',
      message: `CPU 使用率过高: ${metrics.cpu.usage.toFixed(2)}%`,
    });
  } else if (metrics.cpu.usage > 80) {
    anomalies.push({
      component: 'CPU',
      severity: 'medium',
      message: `CPU 使用率较高: ${metrics.cpu.usage.toFixed(2)}%`,
    });
  }
  
  if (metrics.cpu.temperature > 85) {
    anomalies.push({
      component: 'CPU',
      severity: 'critical',
      message: `CPU 温度过高: ${metrics.cpu.temperature.toFixed(2)}°C`,
    });
  } else if (metrics.cpu.temperature > 75) {
    anomalies.push({
      component: 'CPU',
      severity: 'high',
      message: `CPU 温度较高: ${metrics.cpu.temperature.toFixed(2)}°C`,
    });
  }
  
  const memoryUsagePercent = (metrics.memory.used / metrics.memory.total) * 100;
  if (memoryUsagePercent > 90) {
    anomalies.push({
      component: 'Memory',
      severity: 'high',
      message: `内存使用率过高: ${memoryUsagePercent.toFixed(2)}%`,
    });
  } else if (memoryUsagePercent > 80) {
    anomalies.push({
      component: 'Memory',
      severity: 'medium',
      message: `内存使用率较高: ${memoryUsagePercent.toFixed(2)}%`,
    });
  }
  
  const diskUsagePercent = (metrics.disk.used / metrics.disk.total) * 100;
  if (diskUsagePercent > 90) {
    anomalies.push({
      component: 'Disk',
      severity: 'high',
      message: `磁盘使用率过高: ${diskUsagePercent.toFixed(2)}%`,
    });
  } else if (diskUsagePercent > 80) {
    anomalies.push({
      component: 'Disk',
      severity: 'medium',
      message: `磁盘使用率较高: ${diskUsagePercent.toFixed(2)}%`,
    });
  }
  
  // 简单提取AI分析中的见解和建议
  const insights = [];
  const recommendations = [];
  
  // 尝试从AI响应中提取见解
  const insightsMatch = analysisText.match(/见解[：:]([\s\S]*?)(?=建议[：:]|$)/i);
  if (insightsMatch && insightsMatch[1]) {
    const insightsList = insightsMatch[1].split(/\n/).filter(line => line.trim());
    insights.push(...insightsList.map(line => line.trim().replace(/^[\d\.\-\*•]+\s*/, '')));
  }
  
  // 尝试从AI响应中提取建议
  const recommendationsMatch = analysisText.match(/建议[：:]([\s\S]*?)(?=$)/i);
  if (recommendationsMatch && recommendationsMatch[1]) {
    const recommendationsList = recommendationsMatch[1].split(/\n/).filter(line => line.trim());
    recommendations.push(...recommendationsList.map(line => line.trim().replace(/^[\d\.\-\*•]+\s*/, '')));
  }
  
  // 如果AI没有提供足够的见解或建议，添加一些基本的
  if (insights.length === 0) {
    if (anomalies.length > 0) {
      insights.push('系统存在性能异常，需要进一步监控');
    } else {
      insights.push('系统指标正常，未发现明显异常');
    }
  }
  
  if (recommendations.length === 0) {
    if (anomalies.length > 0) {
      recommendations.push('建议排查高负载进程');
      recommendations.push('考虑优化应用性能或增加资源');
    } else {
      recommendations.push('继续保持当前监控频率');
    }
  }
  
  // 计算健康评分（0-100）
  let healthScore = 100;
  // 根据异常扣分
  anomalies.forEach(anomaly => {
    switch (anomaly.severity) {
      case 'critical':
        healthScore -= 25;
        break;
      case 'high':
        healthScore -= 15;
        break;
      case 'medium':
        healthScore -= 10;
        break;
      case 'low':
        healthScore -= 5;
        break;
    }
  });
  // 确保分数在0-100范围内
  healthScore = Math.max(0, Math.min(100, healthScore));
  
  return {
    anomalies,
    healthScore,
    insights,
    recommendations,
    timestamp: new Date().toISOString(),
    sessionId: threadId,  // 返回会话ID，便于后续分析引用
  };
} 