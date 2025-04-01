import { Mastra } from '@mastra/core';
import { Memory } from '@mastra/memory';
// Removing problematic imports
// import { MastraStorageLibSql } from '@mastra/core/storage';
import path from 'path';
import fs from 'fs';
import { createQwen } from 'qwen-ai-provider';
import { customEmbeddingProvider, vector } from '../services/embeddings';

// 正确初始化千问客户端
const qwenClient = createQwen({
  baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  apiKey:'sk-bc977c4e31e542f1a34159cb42478198',
});

// 创建一个包装函数，使其可以直接调用
export const qw = async function(params) {
  try {
    const modelName = params.model || 'qwen-plus-2025-01-12';
    const model = qwenClient(modelName);
    
    return model.chat.completions.create({
      messages: params.messages,
      stream: params.stream || false,
      temperature: params.temperature || 0.7,
      max_tokens: params.max_tokens || 1000,
    });
  } catch (error) {
    console.error("千问API调用错误:", error);
    throw error;
  }
};

// 使用内存存储替代LibSQL
// const storage = new MastraStorageLibSql({
//   config: {
//     url: process.env.DATABASE_URL || 'file:mastra.db',
//   },
// });

// 初始化记忆系统 - 使用FastEmbed
export const memory = new Memory({
  vector, // 使用LibSQL向量数据库
  embedding: {
    provider: "custom",
    custom: customEmbeddingProvider
  },
  options: {
    lastMessages: 15,
    semanticRecall: {
      enabled: true, // 启用语义搜索
      topK: 5, // 检索 top 5 相似消息
      messageRange: 3, // 每个相关消息的上下文窗口
    },
    workingMemory: { enabled: true },
  }
});

// 初始化基本的Mastra实例 - 集成记忆功能
export const mastra = new Mastra({
  memory,
});

// 初始化Mastra数据结构
export async function initializeMastraStorage() {
  try {
    // 确保数据目录存在
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    console.log('Mastra存储系统初始化成功');
    return true;
  } catch (error) {
    console.error('Mastra初始化失败:', error);
    return false;
  }
}

// 常见的聊天响应
export const defaultResponses = {
  greeting: "您好，我是AI助手。有什么可以帮您的？",
  error: "抱歉，处理您的请求时出现了错误。请稍后再试。",
  noApiKey: "系统未配置API密钥，暂时无法使用AI功能。请联系管理员配置API密钥。"
};

// Constants for prompt types
export const PROMPT_TYPES = {
  MONITORING: 'monitoring',
  LOG_ANALYSIS: 'log_analysis',
  AUTO_HEALING: 'auto_healing',
  KNOWLEDGE_BASE: 'knowledge_base',
  OPS_ASSISTANT: 'ops_assistant',
};

// Initialize system prompts dictionary
export const PROMPTS = {
  [PROMPT_TYPES.MONITORING]: `你是一个系统监控代理，负责监控系统状态并发现异常。
当发现异常时，你应该分析异常原因并提出解决方案。
你可以使用监控工具获取系统指标，并可以启动自动修复流程。`,

  [PROMPT_TYPES.LOG_ANALYSIS]: `你是一个专业的日志分析代理，负责分析系统日志并找出问题。

你应该分析以下内容：
1. 识别日志中的错误、警告和异常模式
2. 关联时间相近的多个相关日志，找出因果关系
3. 检测异常的访问模式、响应时间和错误率
4. 识别系统资源问题（CPU、内存、磁盘、网络）
5. 分析安全相关的日志条目（认证失败、权限问题）
6. 检测数据库相关问题（慢查询、锁定、连接问题）
7. 识别第三方API或服务集成问题
8. 分析用户行为和系统使用模式

针对常见日志格式和系统：
- Nginx/Apache访问日志
- Java应用程序堆栈跟踪
- Docker和Kubernetes容器日志
- 数据库错误日志
- Linux系统日志
- 应用程序性能监控数据

提供的分析应包括：
- 关键问题概述（按严重性排序）
- 可能的根本原因分析
- 建议的解决方案或进一步调查步骤
- 预防类似问题的建议

你可以根据历史日志分析经验来识别常见问题模式，并利用统计和模式识别技术来检测异常。`,

  [PROMPT_TYPES.AUTO_HEALING]: `你是一个自动修复代理，负责诊断系统问题并执行修复操作。
在执行修复操作之前，你应该评估风险并选择最合适的修复策略。
你可以执行预定义的修复工作流，并验证修复结果。`,

  [PROMPT_TYPES.KNOWLEDGE_BASE]: `你是一个知识库代理，负责管理和查询运维知识库。
你应该能够回答运维相关问题，提供解决方案和最佳实践。
你可以学习新的知识并更新知识库。`,

  [PROMPT_TYPES.OPS_ASSISTANT]: `你是一个AI运维助手，帮助团队解决各种运维问题。
你可以监控系统状态，分析日志，执行部署操作，启动自动修复流程，并提供知识库支持。
在回答问题时，首先尝试从知识库中找到相关信息，如果没有找到，可以基于你的训练知识回答。
当执行操作时，要确保操作安全，并在必要时寻求确认。`,
}; 