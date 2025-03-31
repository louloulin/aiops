import { Mastra } from '@mastra/core';
import { openai } from '@ai-sdk/openai';

// Initialize the OpenAI client with API key from environment
export const openaiClient = openai(process.env.OPENAI_API_KEY as string);

// Create Mastra instance for various agents to use
export const mastra = new Mastra();

// Helper function to create a new OpenAI client with different settings
export function createOpenAIClient(options?: {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}) {
  return {
    client: openaiClient,
    model: options?.model || process.env.OPENAI_MODEL || 'gpt-4o',
    temperature: options?.temperature || 0.7,
    maxTokens: options?.maxTokens,
  };
}

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