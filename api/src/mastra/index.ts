import { Mastra } from '@mastra/core';
import { Memory } from '@mastra/memory';
import path from 'path';
import fs from 'fs';
import { createQwen } from 'qwen-ai-provider';

const qwen = createQwen({
  baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  apiKey:'sk-bc977c4e31e542f1a34159cb42478198',
});

export const qw = qwen('qwen-plus-2025-01-12');

// 创建高级内存实例
export const memoryInstance = new Memory({
  options: {
    lastMessages: 30,
    semanticRecall: {
      topK: 3,
      messageRange: 5,
    },
    workingMemory: { 
      enabled: true,
      maxSize: 100
    },
  }
});

// 初始化Mastra实例 - 不再传入内存配置
export const mastra = new Mastra();

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

  [PROMPT_TYPES.LOG_ANALYSIS]: `你是一个日志分析代理，负责分析系统日志并找出问题。
你应该识别日志中的异常模式，关联多个相关日志，并提出可能的解决方案。
你可以根据历史日志分析经验来识别常见问题。`,

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