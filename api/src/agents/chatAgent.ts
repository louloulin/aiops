import { Agent } from '@mastra/core/agent';
import { openaiClient } from '../mastra';
import { Memory } from '@mastra/memory';
import { monitoringTools } from '../tools/monitoringTools';
import { logAnalysisTools } from '../tools/logAnalysisTools';
import { autoHealingTools } from '../tools/autoHealingTools';
import { knowledgeBaseTools } from '../tools/knowledgeBaseTools';
import { CoreMessage } from '@mastra/core';
import { db } from '../db';
import { eq } from 'drizzle-orm';

// 初始化记忆系统
const memory = new Memory({
  options: {
    lastMessages: 30,
    semanticRecall: {
      topK: 10,
      messageRange: 5,
    },
    workingMemory: { enabled: true },
  },
});

/**
 * 聊天系统代理
 * 
 * 提供统一的聊天界面，集成所有系统功能。
 * 可以处理自然语言请求并调用适当的系统功能来响应。
 */
export const chatAgent = new Agent({
  name: 'Chat System',
  instructions: `你是AI OPS平台的智能助手，能够帮助用户与整个系统进行交互。你的目标是理解用户意图，并调用合适的系统功能来满足用户需求。

功能范围：
1. 系统监控：查询CPU、内存、磁盘、网络等系统指标
2. 日志分析：查询和分析日志文件，识别异常和错误模式
3. 自动修复：诊断和修复系统问题
4. 知识库：查询运维知识和最佳实践
5. 预测分析：基于历史数据预测未来趋势和潜在问题
6. 告警管理：查看和管理系统告警
7. 服务健康：检查服务状态和依赖关系

交互指南：
- 直接回答用户问题，不要介绍自己
- 如果请求不明确，请询问更多细节
- 如果用户请求超出你的能力范围，请诚实地表明
- 尽可能提供具体、实用的信息
- 对于复杂任务，将其分解为多个步骤并逐步执行

请尽量使用中文回复，除非用户明确使用其他语言提问。`,
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
 * 聊天消息接口
 */
export interface ChatMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

/**
 * 发送消息到聊天代理
 * @param message 用户消息
 * @param conversationId 会话ID
 * @returns 助手回复
 */
export async function sendChatMessage(message: string, conversationId?: string) {
  const messages: CoreMessage[] = [
    {
      role: 'user',
      content: message,
    }
  ];

  const newConversationId = conversationId || generateConversationId();
  const resourceId = `conversation-${newConversationId}`;
  const threadId = newConversationId;

  // 保存用户消息到数据库
  const userMessageId = await saveChatMessage({
    id: generateMessageId(),
    conversationId: newConversationId,
    role: 'user',
    content: message,
    timestamp: new Date()
  });

  // 生成回复
  const response = await chatAgent.generate(messages, { resourceId, threadId });

  // 保存助手回复到数据库
  const assistantMessageId = await saveChatMessage({
    id: generateMessageId(),
    conversationId: newConversationId,
    role: 'assistant',
    content: response.text,
    timestamp: new Date()
  });

  return {
    answer: response.text,
    query: message,
    conversationId: newConversationId,
    timestamp: new Date().toISOString(),
  };
}

/**
 * 获取会话历史
 * @param conversationId 会话ID
 * @returns 会话消息列表
 */
export async function getChatHistory(conversationId: string) {
  try {
    // 假设这里有一个聊天消息表
    // 实际实现需要根据数据库架构调整
    /*
    const messages = await db.query.chatMessages.findMany({
      where: eq(chatMessages.conversationId, conversationId),
      orderBy: [asc(chatMessages.timestamp)]
    });
    */
    
    // 临时返回空数组，实际实现需连接数据库
    return [];
  } catch (error) {
    console.error('获取聊天历史失败:', error);
    return [];
  }
}

/**
 * 保存聊天消息
 * @param message 聊天消息
 * @returns 消息ID
 */
async function saveChatMessage(message: ChatMessage): Promise<string> {
  try {
    // 这里应该实现保存消息到数据库的逻辑
    // 实际实现需要根据数据库架构调整
    console.log('保存聊天消息:', message);
    return message.id;
  } catch (error) {
    console.error('保存聊天消息失败:', error);
    return message.id;
  }
}

/**
 * 生成唯一的会话ID
 * @returns 会话ID
 */
function generateConversationId(): string {
  return `chat-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * 生成唯一的消息ID
 * @returns 消息ID
 */
function generateMessageId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
} 