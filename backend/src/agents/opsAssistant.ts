import { Agent } from '@mastra/core/agent';
import { openaiClient, PROMPTS, PROMPT_TYPES } from '../mastra';
import { Memory } from '@mastra/memory';
import { monitoringTools } from '../tools/monitoringTools';
import { logAnalysisTools } from '../tools/logAnalysisTools';
import { autoHealingTools } from '../tools/autoHealingTools';
import { knowledgeBaseTools } from '../tools/knowledgeBaseTools';
import { CoreMessage } from '@mastra/core';

// 初始化记忆系统
const memory = new Memory({
  options: {
    lastMessages: 20,
    semanticRecall: {
      topK: 5,
      messageRange: 2,
    },
    workingMemory: { enabled: true },
  },
});

/**
 * 运维助手代理
 * 
 * 帮助团队解决各种运维问题。
 * 可以监控系统状态，分析日志，执行部署操作，启动自动修复流程，并提供知识库支持。
 */
export const opsAssistant = new Agent({
  name: 'OPS Assistant',
  instructions: PROMPTS[PROMPT_TYPES.OPS_ASSISTANT],
  model: openaiClient,
  tools: {
    ...monitoringTools,
    ...logAnalysisTools,
    ...autoHealingTools,
    ...knowledgeBaseTools,
  },
  memory,
});

/**
 * 向运维助手提问
 * @param query 问题
 * @param conversationId 会话ID
 * @returns 回答
 */
export async function askOpsAssistant(query: string, conversationId?: string) {
  const messages: CoreMessage[] = [
    {
      role: 'user',
      content: query,
    }
  ];

  // 如果有会话ID，则将其添加到上下文
  const resourceId = conversationId ? `conversation-${conversationId}` : undefined;
  const threadId = conversationId;

  const response = resourceId && threadId 
    ? await opsAssistant.generate(messages, { resourceId, threadId })
    : await opsAssistant.generate(messages);

  return {
    answer: response.text,
    query,
    conversationId: conversationId || generateConversationId(),
    timestamp: new Date().toISOString(),
  };
}

/**
 * 生成唯一的会话ID
 * @returns 会话ID
 */
function generateConversationId(): string {
  return `conv-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
} 