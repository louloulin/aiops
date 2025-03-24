import { Agent } from "@mastra/core/agent";
import { openaiClient, PROMPTS, PROMPT_TYPES } from "../mastra";
import { autoHealingTools } from "../tools/autoHealingTools";

/**
 * 问题接口
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
 * 修复结果接口
 */
export interface RemediationResult {
  success: boolean;
  actionsTaken: string[];
  message: string;
  timestamp: string;
}

/**
 * 自动修复智能体
 * 负责诊断系统问题，制定修复计划，并在可能的情况下自动执行修复操作
 */
export const autoHealingAgent = new Agent({
  name: "Auto-Healing Agent",
  instructions: PROMPTS[PROMPT_TYPES.AUTO_HEALING],
  model: openaiClient,
  tools: autoHealingTools,
});

/**
 * 诊断系统问题并生成修复计划
 * @param issue 系统问题描述
 * @returns 诊断结果和修复计划
 */
export async function diagnoseAndRemediate(issue: Issue) {
  // 格式化问题描述
  const issueDescription = `
  问题信息:
  ID: ${issue.id}
  类型: ${issue.type}
  严重程度: ${issue.severity}
  描述: ${issue.description}
  受影响系统: ${issue.affectedSystem}
  检测时间: ${issue.detectedAt}
  
  ${issue.metrics ? `相关指标:\n${JSON.stringify(issue.metrics, null, 2)}` : ''}
  
  ${issue.logs ? `相关日志:\n${issue.logs.map(log => JSON.stringify(log)).join('\n')}` : ''}
  `;
  
  // 使用自动修复代理分析问题
  const response = await autoHealingAgent.generate([
    { 
      role: "system", 
      content: "你是一个专门修复系统问题的 AI 助手。请分析以下系统问题，诊断根本原因，并提供修复计划。"
    },
    { 
      role: "user", 
      content: `请诊断以下系统问题并提供修复计划：\n${issueDescription}`
    }
  ]);
  
  // 处理代理响应
  const analysisText = typeof response === 'string' ? response : JSON.stringify(response);
  
  // 从分析文本中提取各部分内容
  const diagnosisMatch = analysisText.match(/诊断[：:]([\s\S]*?)(?=修复计划[：:]|$)/i);
  const remediationMatch = analysisText.match(/修复计划[：:]([\s\S]*?)(?=修复步骤[：:]|$)/i);
  const stepsMatch = analysisText.match(/修复步骤[：:]([\s\S]*?)(?=预期结果[：:]|$)/i);
  const expectedResultsMatch = analysisText.match(/预期结果[：:]([\s\S]*?)(?=$)/i);
  
  // 提取诊断结果
  const diagnosis = diagnosisMatch 
    ? diagnosisMatch[1].trim() 
    : "无法确定根本原因";
  
  // 提取修复计划
  const remediationPlan = remediationMatch 
    ? remediationMatch[1].trim() 
    : "无可用的修复计划";
  
  // 提取修复步骤
  const steps = stepsMatch 
    ? stepsMatch[1].split(/\n/)
      .filter(line => line.trim())
      .map(line => line.trim().replace(/^\d+\.\s*/, ''))
    : [];
  
  // 提取预期结果
  const expectedResults = expectedResultsMatch 
    ? expectedResultsMatch[1].trim() 
    : "未提供预期结果";
  
  return {
    issue,
    diagnosis,
    remediationPlan,
    steps,
    expectedResults,
    timestamp: new Date().toISOString(),
  };
}

/**
 * 验证修复结果
 * @param issue 原始问题
 * @param result 修复结果
 * @returns 验证结果
 */
export async function validateRemediation(issue: Issue, result: RemediationResult) {
  const validationPrompt = `
  请验证以下修复操作是否已成功解决问题：
  
  原始问题:
  ${issue.description}
  
  修复结果:
  - 成功: ${result.success}
  - 操作: ${result.actionsTaken.join(', ')}
  - 消息: ${result.message}
  
  请提供验证结果和建议。
  `;
  
  const response = await autoHealingAgent.generate([
    { role: "user", content: validationPrompt }
  ]);
  
  const validationText = typeof response === 'string' ? response : '';
  
  return {
    originalIssue: issue,
    remediationResult: result,
    validationResult: validationText || '',
    timestamp: new Date().toISOString(),
  };
} 