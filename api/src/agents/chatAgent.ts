import { Agent } from '@mastra/core/agent';
import { qw, saveMessageToHistory, getMessageHistory, defaultResponses } from '../mastra';
import { CoreMessage } from '@mastra/core';

// 服务类型定义
type Services = {
  metricsService?: any;
  serverService?: any;
  logService?: any;
  alertService?: any;
  [key: string]: any;
};

/**
 * 聊天消息接口
 */
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string | Date;
}

/**
 * UI动作接口
 */
export interface UIAction {
  action: string;
  [key: string]: any;
}

/**
 * 聊天响应接口
 */
export interface ChatResponse {
  response: string;
  actions?: UIAction[];
}

/**
 * 聊天代理类
 * 提供简化的聊天功能，使用千问模型
 */
export class ChatAgent {
  public agent: Agent | null;
  private services: Services;
  
  /**
   * 构造函数
   * @param llmClient LLM客户端
   * @param services 服务集合
   */
  constructor(llmClient: any, services: Services = {}) {
    this.services = services;
    
    // 如果没有API密钥，使用null而不创建agent
    if (!llmClient) {
      this.agent = null;
      console.warn('未提供LLM客户端，将使用模拟响应');
      return;
    }
    
    // 创建代理，指定使用千问模型
    try {
      this.agent = new Agent({
        name: 'Chat System',
        instructions: `你是AI OPS平台的智能助手。请直接清晰地回答用户问题，优先使用中文。`,
        model: llmClient,
      });
      console.log('成功创建千问聊天代理');
    } catch (error) {
      console.error('创建千问代理失败:', error);
      this.agent = null;
    }
  }
  
  /**
   * 从文本中提取UI操作指令
   * @param text 文本内容
   * @returns UI操作指令数组
   */
  public extractUIActions(text: string): UIAction[] {
    const actions: UIAction[] = [];
    
    // 查找 ```ui-action ... ``` 格式的代码块
    const actionPattern = /```ui-action\s+([\s\S]*?)\s*```/g;
    let match;
    
    while ((match = actionPattern.exec(text)) !== null) {
      try {
        const actionJson = match[1].trim();
        const action = JSON.parse(actionJson);
        
        // 确保动作有效
        if (action && action.action) {
          actions.push(action);
        }
      } catch (e) {
        console.error('解析UI操作失败:', e);
      }
    }
    
    return actions;
  }
  
  /**
   * 根据路由路径描述当前视图
   * @param route 路由路径
   * @returns 视图描述
   */
  private describeView(route?: string): string {
    if (!route) return '未知视图';
    
    // 根据路由提供更具体的视图描述
    if (route.startsWith('/dashboard')) return '监控仪表盘';
    if (route.startsWith('/servers')) return '服务器列表';
    if (route.startsWith('/server/')) return '服务器详情';
    if (route.startsWith('/metrics')) return '指标页面';
    if (route.startsWith('/logs')) return '日志分析';
    if (route.startsWith('/alerts')) return '告警管理';
    if (route.startsWith('/predictive')) return '预测分析';
    if (route.startsWith('/knowledge')) return '知识库';
    
    return '未知视图';
  }
}

// 创建默认聊天代理实例
export const chatAgent = new ChatAgent(qw);

/**
 * 发送消息到聊天代理
 * @param message 用户消息
 * @param conversationId 会话ID
 * @param context UI上下文信息
 * @returns 助手回复
 */
export async function sendChatMessage(
  message: string, 
  conversationId?: string,
  context?: Record<string, any>
) {
  try {
    // 生成唯一ID用于会话管理
    const threadId = conversationId || `chat-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    
    // 保存用户消息到历史
    const userMessage = {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    };
    
    saveMessageToHistory(threadId, userMessage);
    
    // 如果没有可用的agent，返回模拟响应
    if (!chatAgent.agent) {
      console.log('使用模拟响应模式');
      const simulatedAnswer = getSimulatedResponse(message);
      
      const assistantMessage = {
        role: 'assistant',
        content: simulatedAnswer,
        timestamp: new Date().toISOString()
      };
      
      saveMessageToHistory(threadId, assistantMessage);
      
      return {
        answer: simulatedAnswer,
        query: message,
        conversationId: threadId,
        timestamp: new Date().toISOString(),
        actions: [],
      };
    }
    
    // 准备消息
    const messages: CoreMessage[] = [{ role: 'user', content: message }];
    
    // 如果上下文可用，添加系统消息
    if (context && Object.keys(context).length > 0) {
      messages.unshift({
        role: 'system',
        content: `用户当前界面上下文: ${JSON.stringify(context)}\n请根据上下文提供相关回答。`
      });
    }
    
    // 调用Mastra代理生成回复
    let cleanResponse = '';
    let actions = [];
    
    try {
      // 尝试调用千问API
      const response = await chatAgent.agent.generate(messages);
      
      // 提取UI操作指令
      actions = chatAgent.extractUIActions(response.text);
      
      // 如果存在UI操作指令，从回复中去除指令代码
      cleanResponse = response.text;
      if (actions && actions.length > 0) {
        // 移除所有UI操作代码块
        const actionPattern = /```ui-action\s+([\s\S]*?)\s*```/g;
        cleanResponse = cleanResponse.replace(actionPattern, '').trim();
      }
    } catch (apiError) {
      console.error('API调用失败，使用模拟响应:', apiError);
      cleanResponse = getSimulatedResponse(message);
    }
    
    // 保存助手回复到历史
    const assistantMessage = {
      role: 'assistant',
      content: cleanResponse,
      timestamp: new Date().toISOString()
    };
    
    saveMessageToHistory(threadId, assistantMessage);
    
    return {
      answer: cleanResponse,
      query: message,
      conversationId: threadId,
      timestamp: new Date().toISOString(),
      actions,
    };
  } catch (error) {
    console.error('发送聊天消息失败:', error);
    
    // 返回错误响应
    return {
      answer: defaultResponses.error,
      query: message,
      conversationId: conversationId || `chat-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      actions: [],
    };
  }
}

/**
 * 生成模拟的AI响应
 * 当没有可用的AI模型时，使用这个函数生成简单的响应
 */
function getSimulatedResponse(message: string): string {
  // 检查问题类型，返回不同的模拟回复
  message = message.toLowerCase();
  
  if (message.includes('你好') || message.includes('hello') || message.includes('hi')) {
    return "您好！我是AI助手。很高兴为您服务，请问有什么可以帮助您的？";
  }
  
  if (message.includes('监控') || message.includes('cpu') || message.includes('内存') || message.includes('服务器')) {
    return "根据监控数据，所有服务器运行正常。CPU使用率在45%左右，内存使用率约为60%，网络流量稳定。";
  }
  
  if (message.includes('日志') || message.includes('错误') || message.includes('异常')) {
    return "最近的日志分析显示没有严重错误。有少量的警告信息，主要与连接超时有关，但系统已自动重试并恢复。";
  }
  
  if (message.includes('预测') || message.includes('趋势') || message.includes('分析')) {
    return "根据历史数据分析，系统负载预计在下周会增加约20%。建议提前扩容资源，特别是数据库服务器。";
  }
  
  // 默认回复
  return "我理解您的问题。在当前的模拟模式下，我无法提供详细的回答。请确保系统配置了有效的API密钥以启用完整的AI功能。";
}

/**
 * 获取会话历史
 * 使用内存存储获取历史消息
 * @param conversationId 会话ID
 * @returns 会话消息列表
 */
export async function getChatHistory(conversationId: string) {
  try {
    return getMessageHistory(conversationId);
  } catch (error) {
    console.error('获取聊天历史失败:', error);
    return [];
  }
}

/**
 * 生成唯一的会话ID
 * @returns 会话ID
 */
export function generateConversationId(): string {
  return `chat-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
} 