import { Agent } from "@mastra/core/agent";
import { openaiClient, PROMPTS, PROMPT_TYPES } from "../mastra";
import { monitoringTools } from "../tools/monitoringTools";

/**
 * 监控代理
 * 
 * 负责监控系统状态并发现异常。
 * 当发现异常时，分析异常原因并提出解决方案。
 */
export const monitoringAgent = new Agent({
  name: "Monitoring Agent",
  instructions: PROMPTS[PROMPT_TYPES.MONITORING],
  model: openaiClient,
  tools: monitoringTools,
});

/**
 * 分析系统指标
 * @param metrics 系统指标数据
 * @returns 分析结果
 */
export async function analyzeSystemMetrics(metrics: any) {
  const response = await monitoringAgent.generate([
    {
      role: "user",
      content: `请分析以下系统指标数据，找出异常并提出解决方案：\n${JSON.stringify(metrics, null, 2)}`,
    }
  ]);

  return {
    analysis: response.text,
    metrics,
    timestamp: new Date().toISOString(),
  };
} 