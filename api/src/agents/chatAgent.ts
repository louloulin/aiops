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
  instructions: `你是AI OPS平台的中央智能助手。你的主要职责是理解用户的运维请求，并利用系统中所有可用的专业工具和代理来满足这些需求。请协调使用以下功能：

功能范围：
1.  **系统监控**: 使用\`monitoringTools\`查询实时和历史系统指标 (CPU, 内存, 磁盘, 网络), 检查服务健康状态。
2.  **日志分析**: 使用\`logAnalysisTools\`查询、分析和聚合日志，识别错误、异常模式和趋势。
3.  **自动修复**: 使用\`autoHealingTools\`诊断问题并启动预定义的修复流程。在执行敏感操作前寻求确认。
4.  **知识库**: 使用\`knowledgeBaseTools\`查询运维文档、解决方案和最佳实践。
5.  **预测分析**: 使用\`predictiveTools\` (如果可用) 分析历史数据，预测未来资源使用趋势，并检测潜在异常。
6.  **告警管理**: (通过监控工具) 查看和管理系统告警。

交互指南：
-   直接、清晰地回答用户问题，无需自我介绍。
-   根据用户请求的性质，选择最合适的工具或组合工具来完成任务。
-   如果请求不明确或需要更多信息才能选择正确的工具，请向用户提问澄清。
-   如果用户请求的操作涉及更改系统状态（例如，启动修复），请解释将要执行的操作并请求用户确认。
-   对于复杂查询，可能需要按顺序调用多个工具。请组织好响应，清晰地呈现结果。
-   优先使用中文回复，除非用户明确使用其他语言。`,
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
  await saveChatMessage({
    id: generateMessageId(),
    conversationId: newConversationId,
    role: 'user',
    content: message,
    timestamp: new Date()
  });

  // 生成回复
  const response = await chatAgent.generate(messages, { resourceId, threadId });

  // 保存助手回复到数据库
  await saveChatMessage({
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