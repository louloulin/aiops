import { Agent } from "@mastra/core/agent";
import { openaiClient, PROMPTS, PROMPT_TYPES } from "../mastra";
import { monitoringTools } from "../tools/monitoringTools";
import { SystemMetrics } from "../services/metrics";

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

/**
 * 监控智能体
 * 负责分析系统指标，识别异常，并提供优化建议
 */
export const monitoringAgent = new Agent({
  name: "Monitoring Agent",
  instructions: PROMPTS[PROMPT_TYPES.MONITORING],
  model: openaiClient,
  tools: monitoringTools,
});

/**
 * 分析系统指标数据
 * @param metrics 系统指标数据
 * @returns 分析结果，包括异常、健康分数和建议
 */
export async function analyzeSystemMetrics(metrics: SystemMetrics): Promise<MonitoringAnalysisResult> {
  // 格式化指标数据为文本描述
  const metricsDescription = `
    系统当前状态：
    - CPU：使用率 ${metrics.cpu.usage.toFixed(2)}%，温度 ${metrics.cpu.temperature.toFixed(2)}°C
    - 内存：总计 ${metrics.memory.total}MB，已使用 ${metrics.memory.used.toFixed(2)}MB，空闲 ${metrics.memory.free.toFixed(2)}MB
    - 磁盘：总计 ${metrics.disk.total}MB，已使用 ${metrics.disk.used.toFixed(2)}MB，空闲 ${metrics.disk.free.toFixed(2)}MB
    - 网络：入站流量 ${metrics.network.bytesIn.toFixed(2)}bytes，出站流量 ${metrics.network.bytesOut.toFixed(2)}bytes
  `;

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
  ]);

  // 处理代理响应，提取分析结果
  // 注：在实际项目中，可能需要更复杂的结果解析，或者使用结构化输出格式
  const analysisText = typeof response === 'string' ? response : JSON.stringify(response);
  
  // 简单的异常检测逻辑
  const anomalies = [];
  
  if (metrics.cpu.usage > 90) {
    anomalies.push({
      component: 'CPU',
      severity: 'high',
      message: `CPU 使用率过高: ${metrics.cpu.usage.toFixed(2)}%`,
    });
  } else if (metrics.cpu.usage > 70) {
    anomalies.push({
      component: 'CPU',
      severity: 'medium',
      message: `CPU 使用率偏高: ${metrics.cpu.usage.toFixed(2)}%`,
    });
  }
  
  if (metrics.cpu.temperature > 60) {
    anomalies.push({
      component: 'CPU',
      severity: 'critical',
      message: `CPU 温度过高: ${metrics.cpu.temperature.toFixed(2)}°C`,
    });
  } else if (metrics.cpu.temperature > 50) {
    anomalies.push({
      component: 'CPU',
      severity: 'high',
      message: `CPU 温度偏高: ${metrics.cpu.temperature.toFixed(2)}°C`,
    });
  }
  
  const memoryUsage = (metrics.memory.used / metrics.memory.total) * 100;
  if (memoryUsage > 90) {
    anomalies.push({
      component: 'Memory',
      severity: 'high',
      message: `内存使用率过高: ${memoryUsage.toFixed(2)}%`,
    });
  } else if (memoryUsage > 80) {
    anomalies.push({
      component: 'Memory',
      severity: 'medium',
      message: `内存使用率偏高: ${memoryUsage.toFixed(2)}%`,
    });
  }
  
  const diskUsage = (metrics.disk.used / metrics.disk.total) * 100;
  if (diskUsage > 90) {
    anomalies.push({
      component: 'Disk',
      severity: 'high',
      message: `磁盘使用率过高: ${diskUsage.toFixed(2)}%`,
    });
  } else if (diskUsage > 75) {
    anomalies.push({
      component: 'Disk',
      severity: 'medium',
      message: `磁盘使用率偏高: ${diskUsage.toFixed(2)}%`,
    });
  }
  
  // 计算健康分数
  let healthScore = 100;
  anomalies.forEach(anomaly => {
    if (anomaly.severity === 'critical') healthScore -= 25;
    else if (anomaly.severity === 'high') healthScore -= 15;
    else if (anomaly.severity === 'medium') healthScore -= 10;
    else healthScore -= 5;
  });
  
  // 从代理响应中提取洞察和建议
  // 这是一个简化的示例，实际中可能需要使用更复杂的文本处理或结构化输出
  const insightsMatch = analysisText.match(/洞察[：:]([\s\S]*?)(?=建议[：:]|$)/i);
  const recommendationsMatch = analysisText.match(/建议[：:]([\s\S]*?)(?=$)/i);
  
  const insights = insightsMatch 
    ? insightsMatch[1].split(/\n/).filter(line => line.trim()).map(line => line.trim().replace(/^[•\-]\s*/, ''))
    : [];
  
  const recommendations = recommendationsMatch
    ? recommendationsMatch[1].split(/\n/).filter(line => line.trim()).map(line => line.trim().replace(/^[•\-]\s*/, ''))
    : [];

  return {
    anomalies,
    healthScore: Math.max(0, healthScore),
    insights,
    recommendations,
    timestamp: new Date().toISOString()
  };
} 