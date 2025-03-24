import { Agent } from "@mastra/core/agent";
import { openaiClient, PROMPTS, PROMPT_TYPES } from "../mastra";
import { autoHealingTools } from "../tools/autoHealingTools";

/**
 * 问题界面
 */
export interface Issue {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affectedSystem: string;
  detectedAt: string;
  metrics?: Record<string, any>;
  logs?: any[];
}

/**
 * 修复结果界面
 */
export interface RemediationResult {
  success: boolean;
  actionsTaken: string[];
  message: string;
  timestamp: string;
}

/**
 * 自动修复代理
 * 
 * 负责诊断系统问题并执行修复操作。
 * 在执行修复操作之前，评估风险并选择最合适的修复策略。
 */
export const autoHealingAgent = new Agent({
  name: "Auto-Healing Agent",
  instructions: PROMPTS[PROMPT_TYPES.AUTO_HEALING],
  model: openaiClient,
  tools: autoHealingTools,
});

/**
 * 诊断问题并生成修复方案
 * @param issue 系统问题
 * @returns 修复方案
 */
export async function diagnoseAndRemediate(issue: Issue): Promise<RemediationResult> {
  const response = await autoHealingAgent.generate([
    {
      role: "user",
      content: `请诊断以下系统问题，并提出具体的修复方案：\n${JSON.stringify(issue, null, 2)}`,
    }
  ]);

  // 解析响应内容
  const remediation = response.text || '';
  
  // 在此处理实际的修复操作（模拟）
  const actionsTaken = remediation
    .split('\n')
    .filter((line: string) => line.trim().startsWith('-') || line.trim().startsWith('*'))
    .map((line: string) => line.trim().replace(/^[-*]\s+/, ''));

  return {
    success: true,
    actionsTaken: actionsTaken.length > 0 ? actionsTaken : ['分析问题', '生成修复方案'],
    message: remediation,
    timestamp: new Date().toISOString(),
  };
} 