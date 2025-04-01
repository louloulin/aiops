import { Hono } from 'hono';
import { z } from 'zod';
import { sendChatMessage, getChatHistory } from '../agents/chatAgent';

const chatRoutes = new Hono();

// 验证聊天消息架构
const chatMessageSchema = z.object({
  message: z.string().min(1, '消息不能为空'),
  conversationId: z.string().optional(),
});

// 验证会话ID架构
const conversationIdSchema = z.object({
  conversationId: z.string(),
});

/**
 * 发送聊天消息端点
 * POST /api/chat/send
 */
chatRoutes.post('/send', async (c) => {
  const body = await c.req.json();
  
  // 验证请求体
  const result = chatMessageSchema.safeParse(body);
  if (!result.success) {
    return c.json(
      { error: '无效请求', details: result.error.format() },
      { status: 400 }
    );
  }
  
  const { message, conversationId } = result.data;
  
  try {
    // 发送消息到聊天代理
    const response = await sendChatMessage(message, conversationId);
    
    return c.json({
      response: response.answer,
      conversationId: response.conversationId,
      timestamp: response.timestamp,
    });
  } catch (error) {
    console.error('聊天处理错误:', error);
    return c.json(
      { error: '处理聊天消息失败' },
      { status: 500 }
    );
  }
});

/**
 * 获取聊天历史端点
 * GET /api/chat/history/:conversationId
 */
chatRoutes.get('/history/:conversationId', async (c) => {
  const conversationId = c.req.param('conversationId');
  
  // 验证会话ID
  const result = conversationIdSchema.safeParse({ conversationId });
  if (!result.success) {
    return c.json(
      { error: '无效会话ID', details: result.error.format() },
      { status: 400 }
    );
  }
  
  try {
    // 获取聊天历史
    const history = await getChatHistory(conversationId);
    
    return c.json({
      conversationId,
      messages: history,
    });
  } catch (error) {
    console.error('获取聊天历史错误:', error);
    return c.json(
      { error: '获取聊天历史失败' },
      { status: 500 }
    );
  }
});

export { chatRoutes }; 