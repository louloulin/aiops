import { Agent } from '@mastra/core/agent';
import { qw, PROMPTS, PROMPT_TYPES, memory } from '../mastra';
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
  model: qw,
  tools: knowledgeBaseTools,
  memory,
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
 * @param sessionId 可选的会话ID，用于保持上下文连续性
 * @returns 回答结果
 */
export async function queryKnowledgeBase(query: string, sessionId?: string) {
  // 生成会话ID，如果未提供
  const threadId = sessionId || `kb_query_${Date.now()}`;
  
  // 内存选项配置
  const memoryOptions = {
    lastMessages: 10,           // 保留最近的10条消息，知识库问答需要更多上下文
    semanticRecall: {
      enabled: false,           // 禁用语义搜索，避免嵌入错误
      // topK: 5,               // 检索最相关的5条历史记录
      // messageRange: 2,       // 每个相关消息的上下文窗口
    },
    workingMemory: { enabled: true },
  };
  
  const response = await knowledgeBaseAgent.generate([
    {
      role: "user",
      content: `${query}`,
    }
  ], {
    resourceId: `knowledge_base_${threadId}`,
    threadId: threadId,
    memoryOptions,
  });

  return {
    answer: typeof response === 'string' ? response : response.text,
    query,
    relatedTags: extractTags(typeof response === 'string' ? response : response.text),
    timestamp: new Date().toISOString(),
    sessionId: threadId,  // 返回会话ID，便于后续问答引用
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