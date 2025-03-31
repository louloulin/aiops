import { Agent } from '@mastra/core/agent';
import { openaiClient, PROMPTS, PROMPT_TYPES } from '../mastra';
import { knowledgeBaseTools } from '../tools/knowledgeBaseTools';

/**
 * 知识库代理
 * 
 * 负责管理和查询运维知识库。
 * 能够回答运维相关问题，提供解决方案和最佳实践。
 */
export const knowledgeBaseAgent = new Agent({
  name: 'Knowledge Base Agent',
  instructions: PROMPTS[PROMPT_TYPES.KNOWLEDGE_BASE],
  model: openaiClient,
  tools: knowledgeBaseTools,
});

/**
 * 知识条目接口
 */
export interface KnowledgeEntry {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  author?: string;
}

/**
 * 查询知识库
 * @param query 查询问题
 * @returns 回答结果
 */
export async function queryKnowledgeBase(query: string) {
  const response = await knowledgeBaseAgent.generate([
    {
      role: "user",
      content: `${query}`,
    }
  ]);

  return {
    answer: response.text,
    query,
    relatedTags: extractTags(response.text),
    timestamp: new Date().toISOString(),
  };
}

/**
 * 从回答中提取相关标签
 * @param text 回答文本
 * @returns 提取的标签
 */
function extractTags(text: string): string[] {
  const commonTags = [
    'linux', 'kubernetes', 'docker', 'nginx', 'database', 'networking',
    'security', 'performance', 'monitoring', 'logging', 'backup', 'recovery',
    'deployment', 'configuration', 'troubleshooting', 'scaling'
  ];
  
  return commonTags.filter(tag => text.toLowerCase().includes(tag.toLowerCase()));
} 