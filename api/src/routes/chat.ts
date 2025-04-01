import { Hono } from 'hono';
import { z } from 'zod';
import { sendChatMessage, getChatHistory, generateConversationId } from '../agents/chatAgent';
import { defaultResponses } from '../mastra';

// 定义聊天路由
const chatRoutes = new Hono();

// 验证发送消息请求
const chatMessageSchema = z.object({
  message: z.string().min(1, '消息不能为空'),
  conversationId: z.string().optional(),
  context: z.object({
    route: z.string().optional(),      // 当前路由路径
    viewName: z.string().optional(),   // 当前视图名称
    componentId: z.string().nullable().optional(), // 当前焦点组件ID，允许null
    selectedData: z.any().optional(),  // 当前选中的数据
    activeFilters: z.any().optional(), // 当前激活的过滤器
  }).optional(),
});

// 验证会话ID
const conversationIdSchema = z.object({
  conversationId: z.string(),
});

/**
 * 发送聊天消息端点
 * POST /api/chat/send
 */
chatRoutes.post('/send', async (c) => {
  try {
    console.log('接收到聊天请求: /api/chat/send');
    let body;
    try {
      body = await c.req.json();
      console.log('请求体:', JSON.stringify(body));
    } catch (parseError) {
      console.error('解析请求体失败:', parseError);
      return c.json(
        { error: '无效的JSON请求', details: '请检查请求体格式' },
        { status: 400 }
      );
    }
    
    // 验证请求体
    const result = chatMessageSchema.safeParse(body);
    if (!result.success) {
      console.error('请求验证失败:', JSON.stringify(result.error.format()));
      return c.json(
        { error: '无效请求', details: result.error.format() },
        { status: 400 }
      );
    }
    
    const { message, conversationId, context } = result.data;
    
    console.log(`接收到消息内容: "${message}"`);
    console.log(`会话ID: ${conversationId || '新会话'}`);
    console.log(`上下文: ${context ? JSON.stringify(context) : '无'}`);
    
    // 发送消息到聊天代理，包括上下文信息
    const startTime = Date.now();
    const response = await sendChatMessage(message, conversationId, context);
    const processTime = Date.now() - startTime;
    
    console.log(`处理完成，耗时: ${processTime}ms`);
    
    return c.json({
      response: response.answer,
      conversationId: response.conversationId,
      timestamp: response.timestamp,
      actions: response.actions,
    });
  } catch (error) {
    console.error('聊天处理错误:', error);
    return c.json(
      { error: '处理聊天消息失败', response: defaultResponses.error },
      { status: 500 }
    );
  }
});

/**
 * 获取聊天历史端点
 * GET /api/chat/history/:conversationId
 */
chatRoutes.get('/history/:conversationId', async (c) => {
  try {
    const conversationId = c.req.param('conversationId');
    
    // 验证会话ID
    const result = conversationIdSchema.safeParse({ conversationId });
    if (!result.success) {
      return c.json(
        { error: '无效会话ID', details: result.error.format() },
        { status: 400 }
      );
    }
    
    // 获取聊天历史
    const history = await getChatHistory(conversationId);
    
    return c.json({
      conversationId,
      history,
    });
  } catch (error) {
    console.error('获取聊天历史错误:', error);
    return c.json(
      { error: '获取聊天历史失败' },
      { status: 500 }
    );
  }
});

/**
 * 创建新会话
 * POST /api/chat/sessions
 */
chatRoutes.post('/sessions', async (c) => {
  try {
    // 生成新的会话ID
    const conversationId = generateConversationId();
    
    return c.json({
      conversationId,
      timestamp: new Date().toISOString(),
      message: '会话已创建'
    });
  } catch (error) {
    console.error('创建会话错误:', error);
    return c.json(
      { error: '创建会话失败' },
      { status: 500 }
    );
  }
});

/**
 * 获取所有会话列表 
 * GET /api/chat/sessions
 * 简化实现，目前返回空列表
 */
chatRoutes.get('/sessions', (c) => {
  return c.json({
    sessions: []
  });
});

export { chatRoutes }; 