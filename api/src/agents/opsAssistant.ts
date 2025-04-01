import { Agent } from '@mastra/core/agent';
import { qw, PROMPTS, PROMPT_TYPES, memory } from '../mastra';
import { monitoringTools } from '../tools/monitoringTools';
import { logAnalysisTools } from '../tools/logAnalysisTools';
import { autoHealingTools } from '../tools/autoHealingTools';
import { knowledgeBaseTools } from '../tools/knowledgeBaseTools';
import { CoreMessage } from '@mastra/core';

/**
 * 运维助手代理
 * 
 * 帮助团队解决各种运维问题。
 * 可以监控系统状态，分析日志，执行部署操作，启动自动修复流程，并提供知识库支持。
 */
export const opsAssistant = new Agent({
  name: 'OPS Assistant',
  instructions: PROMPTS[PROMPT_TYPES.OPS_ASSISTANT],
  model: qw,
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
 * @param _userId 用户ID (未使用)
 * @returns 回答
 */
export async function askOpsAssistant(query: string, conversationId?: string, _userId?: string) {
  const messages: CoreMessage[] = [
    {
      role: 'user',
      content: query,
    }
  ];

  // 生成唯一的会话ID，如果未提供
  const threadId = conversationId || generateConversationId();
  
  // 确保资源ID与threadId保持一致
  const resourceId = `user_${threadId}`;
  
  // 内存选项配置
  const memoryOptions = {
    lastMessages: 15,           // 保留最近的15条消息
    semanticRecall: {
      enabled: false,           // 禁用语义搜索，避免嵌入错误
      // topK: 5,               // 检索最相关的5条历史记录
      // messageRange: 2,       // 每个相关消息的上下文窗口
    },
    workingMemory: { enabled: true },
  };

  // 使用记忆系统进行生成
  const response = await opsAssistant.generate(messages, { 
    resourceId,
    threadId,
    memoryOptions,
  });

  return {
    answer: typeof response === 'string' ? response : response.text,
    query,
    conversationId: threadId,
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