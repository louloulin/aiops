import { Agent } from '@mastra/core/agent';
import { v4 as uuidv4 } from 'uuid';
import { qw, PROMPTS, PROMPT_TYPES, memoryInstance } from '../mastra';

// 创建聊天代理
const chatAgent = new Agent({
  name: "ChatAgent",
  instructions: PROMPTS[PROMPT_TYPES.OPS_ASSISTANT],
  model: qw,
  memory: memoryInstance,
});

console.log('聊天代理创建成功');

// 生成会话ID
export function generateConversationId(): string {
  return `chat_${uuidv4()}`;
}

// 发送聊天消息并获取流式响应
export async function* sendChatMessage(message: string, conversationId?: string, context?: any) {
  try {
    const sessionId = conversationId || generateConversationId();
    
    // 准备消息上下文
    const messageContext = {
      ...context,
      timestamp: new Date().toISOString(),
    };
    
    // 使用Agent的流式响应
    const stream = await chatAgent.stream(message, {
      threadId: sessionId,
      resourceId: `user_${sessionId}`,
      context: messageContext,
    });
    
    // 返回流式响应
    for await (const chunk of stream) {
      yield {
        content: chunk.content,
        conversationId: sessionId,
        timestamp: new Date().toISOString(),
      };
    }
    
  } catch (error) {
    console.error('聊天消息处理错误:', error);
    yield {
      content: '抱歉，处理消息时出现错误。',
      conversationId: conversationId,
      timestamp: new Date().toISOString(),
    };
  }
}

// 获取聊天历史
export async function getChatHistory(conversationId: string) {
  try {
    // 使用Mastra的内存API获取历史记录
    const history = await memoryInstance.query({
      threadId: conversationId,
      resourceId: `user_${conversationId}`,
    });
    
    return history.messages.map(msg => ({
      role: msg.role,
      content: msg.content,
      timestamp: msg.timestamp,
    }));
  } catch (error) {
    console.error('获取聊天历史失败:', error);
    return [];
  }
} 