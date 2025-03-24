import { Agent } from '@mastra/core/agent';
import { openai } from '@ai-sdk/openai';
import { knowledgeBaseTools } from '../tools/knowledgeBaseTools';

export const knowledgeBaseAgent = new Agent({
  name: 'Knowledge Base Agent',
  instructions: `You are a knowledge base agent responsible for managing and retrieving information from the operations knowledge base.
  Your role is to answer questions about system operations, troubleshooting, best practices, and procedures.
  You should use the knowledge base tools to search for relevant information and provide accurate, contextual answers.
  When information is not available in the knowledge base, you should clearly indicate this.
  You should also help identify knowledge gaps and suggest improvements to the knowledge base.`,
  model: openai('gpt-4o'),
  tools: knowledgeBaseTools,
}); 