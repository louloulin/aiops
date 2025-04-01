import { Agent } from "@mastra/core/agent";
import { qw, PROMPTS, PROMPT_TYPES, memory } from "../mastra";
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
  model: qw,
  tools: autoHealingTools,
  memory,
});

/**
 * 诊断系统问题并生成修复计划
 * @param issue 系统问题描述
 * @param sessionId 可选的会话ID，用于保持上下文连续性
 * @returns 诊断结果和修复计划
 */
export async function diagnoseAndRemediate(issue: Issue, sessionId?: string) {
  // 生成会话ID，如果未提供
  const threadId = sessionId || `healing_${issue.id}_${Date.now()}`;
  
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
  
  // 内存选项配置
  const memoryOptions = {
    lastMessages: 10,             // 保留最近的10条消息
    semanticRecall: {
      enabled: false,             // 禁用语义搜索，避免嵌入错误
      // topK: 5,                 // 检索最相关的5条历史记录
      // messageRange: 2,         // 每个相关消息的上下文窗口
    },
    workingMemory: { enabled: true },
  };
  
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
  ], {
    resourceId: `auto_healing_${threadId}`,
    threadId: threadId,
    memoryOptions,
  });
  
  // 处理代理响应
  const analysisText = typeof response === 'string' ? response : response.text;
  
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
    sessionId: threadId,  // 返回会话ID，便于后续操作引用
  };
}

/**
 * 验证修复结果
 * @param issue 原始问题
 * @param result 修复结果
 * @param sessionId 可选的会话ID，应与诊断阶段使用相同ID
 * @returns 验证结果
 */
export async function validateRemediation(issue: Issue, result: RemediationResult, sessionId?: string) {
  // 确保使用相同的会话ID，保持上下文连续性
  const threadId = sessionId || `healing_${issue.id}_${Date.now()}`;
  
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
  
  // 内存选项配置
  const memoryOptions = {
    lastMessages: 5,           // 保留最近的5条消息
    semanticRecall: {
      enabled: false,          // 禁用语义搜索，避免嵌入错误
      // topK: 3,              // 检索最相关的3条历史记录
      // messageRange: 2,      // 每个相关消息的上下文窗口
    },
    workingMemory: { enabled: true },
  };
  
  const response = await autoHealingAgent.generate([
    { role: "user", content: validationPrompt }
  ], {
    resourceId: `auto_healing_${threadId}`,
    threadId: threadId,
    memoryOptions,
  });
  
  const validationText = typeof response === 'string' ? response : response.text;
  
  return {
    originalIssue: issue,
    remediationResult: result,
    validationResult: validationText,
    timestamp: new Date().toISOString(),
    sessionId: threadId,
  };
} 