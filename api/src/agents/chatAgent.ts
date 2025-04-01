import { v4 as uuidv4 } from 'uuid';
import { qw, PROMPTS, PROMPT_TYPES, memory } from '../mastra';
import { Agent } from '@mastra/core/agent';

// 创建聊天代理
export const chatAgent = new Agent({
  name: 'Chat Agent',
  instructions: PROMPTS[PROMPT_TYPES.OPS_ASSISTANT],
  model: qw,
  memory,
});

console.log('聊天代理创建成功');

// 生成会话ID
export function generateConversationId(): string {
  return `chat_${uuidv4()}`;
}

// 发送聊天消息并获取流式响应
export async function* sendChatMessage(message: string, conversationId?: string, _context?: any) {
  try {
    const sessionId = conversationId || generateConversationId();
    
    console.log(`开始处理消息: "${message.slice(0, 50)}${message.length > 50 ? '...' : ''}"`);
    console.log(`会话ID: ${sessionId}`);
    
    // 使用 Memory API 相关选项
    const memoryOptions = {
      lastMessages: 10,            // 最近的10条消息
      semanticRecall: {
        enabled: false,            // 禁用语义搜索，避免嵌入错误
        // topK: 3,                // 检索 top 3 相似消息
        // messageRange: 2,        // 每个匹配消息的上下文窗口
      },
      workingMemory: { enabled: true },
    };
    
    try {
      // 确保资源ID前缀与线程ID匹配
      // 根据错误信息，线程ID为local-1743481693229时，资源ID应为user_local-1743481693229
      // 所以我们使用一致的前缀格式，使用sessionId作为一部分
      const resourceId = `user_${sessionId}`;
      
      console.log(`使用资源ID: ${resourceId}`);
      
      // 使用 Agent 进行流式对话，并利用 Mastra 记忆系统
      const response = await chatAgent.stream(message, {
        resourceId: resourceId,
        threadId: sessionId,
        memoryOptions,
      });
      
      console.log('成功获取AI响应流');
      
      // 用于累积完整的AI响应
      let fullResponse = '';
      
      // 处理流式响应
      for await (const chunk of response) {
        const content = chunk.text || '';
        if (content) {
          fullResponse += content;
          yield {
            content,
            conversationId: sessionId,
            timestamp: new Date().toISOString(),
          };
        }
      }
      
      console.log(`AI响应完成，总长度: ${fullResponse.length}字符`);
      
    } catch (err) {
      console.error('AI处理错误:', err);
      console.error('错误详情:', JSON.stringify(err, null, 2));
      
      // 错误分析
      if (err instanceof Error) {
        console.error(`错误名称: ${err.name}`);
        console.error(`错误消息: ${err.message}`);
        console.error(`错误堆栈: ${err.stack}`);
      }
      
      const errorMessage = '抱歉，AI服务临时不可用，请稍后再试。';
      
      yield {
        content: errorMessage,
        conversationId: sessionId,
        timestamp: new Date().toISOString(),
      };
    }
    
  } catch (error) {
    console.error('聊天消息处理错误:', error);
    console.error('错误详情:', JSON.stringify(error, null, 2));
    
    const errorMessage = '抱歉，处理消息时出现错误。';
    
    yield {
      content: errorMessage,
      conversationId: conversationId || 'error',
      timestamp: new Date().toISOString(),
    };
  }
}

// 获取聊天历史
export async function getChatHistory(conversationId: string) {
  try {
    // 确保资源ID与sendChatMessage中保持一致
    const resourceId = `user_${conversationId}`;
    
    // 使用 Mastra Memory API 获取历史消息
    const history = await memory.getThreadMessages({
      threadId: conversationId,
      resourceId: resourceId, // 添加resourceId参数
      limit: 50, // 最多返回50条消息
    });
    
    console.log(`获取历史记录, ID: ${conversationId}, 消息数: ${history.length}`);
    
    // 转换为与旧格式兼容的格式
    return history.map(msg => ({
      role: msg.role,
      content: msg.content,
      timestamp: msg.createdAt,
    }));
  } catch (error) {
    console.error('获取聊天历史失败:', error);
    return [];
  }
}

// 日志分析辅助函数
export function analyzeLogPattern(logText: string) {
  try {
    console.log('开始分析日志模式');
    
    // 日志级别检测
    const errorCount = (logText.match(/error|exception|fail/gi) || []).length;
    const warnCount = (logText.match(/warn|warning/gi) || []).length;
    const infoCount = (logText.match(/info|information/gi) || []).length;
    
    // 时间戳提取
    const timestamps = logText.match(/\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}/g) || [];
    
    // IP地址提取
    const ipAddresses = logText.match(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g) || [];
    
    // HTTP状态码分析
    const statusCodes = logText.match(/HTTP\/\d\.\d"\s(\d{3})/g) || [];
    const status500 = statusCodes.filter(code => code.endsWith('500')).length;
    const status404 = statusCodes.filter(code => code.endsWith('404')).length;
    const status403 = statusCodes.filter(code => code.endsWith('403')).length;
    
    // 常见错误模式检测
    const nullPointers = (logText.match(/null pointer|undefined|cannot read property/gi) || []).length;
    const timeouts = (logText.match(/timeout|timed out/gi) || []).length;
    const permissions = (logText.match(/permission denied|access denied|unauthorized/gi) || []).length;
    
    const analysis = {
      errorCount,
      warnCount,
      infoCount,
      uniqueTimestamps: new Set(timestamps).size,
      uniqueIpAddresses: new Set(ipAddresses).size,
      httpErrors: {
        status500,
        status404,
        status403
      },
      commonIssues: {
        nullPointers,
        timeouts,
        permissions
      }
    };
    
    console.log('日志分析完成:', JSON.stringify(analysis, null, 2));
    return analysis;
  } catch (error) {
    console.error('日志分析失败:', error);
    return null;
  }
} 