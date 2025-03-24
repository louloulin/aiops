import { createTool } from "@mastra/core/tools";
import { z } from "zod";

/**
 * 查询知识库工具
 * 用于在运维知识库中搜索相关信息
 */
export const searchKnowledgeBaseTool = createTool({
  id: "search-knowledge-base",
  description: "在运维知识库中搜索相关信息",
  inputSchema: z.object({
    query: z.string().describe("搜索查询"),
    tags: z.array(z.string()).optional().describe("标签过滤"),
    limit: z.number().optional().describe("返回结果数量限制"),
  }),
  execute: async ({ context }) => {
    // 模拟知识库数据
    const knowledgeEntries = [
      {
        id: "kb-001",
        title: "Linux 服务器 CPU 使用率过高排查指南",
        content: "本文介绍如何排查 Linux 服务器 CPU 使用率过高的问题。包括使用 top、htop、mpstat 等工具分析 CPU 使用情况，识别占用 CPU 过高的进程，以及常见的处理方法。",
        tags: ["linux", "cpu", "performance", "troubleshooting"],
        createdAt: "2023-01-15T08:30:00Z",
        updatedAt: "2023-03-22T14:45:00Z",
      },
      {
        id: "kb-002",
        title: "Kubernetes Pod 异常重启问题排查",
        content: "本文介绍 Kubernetes Pod 异常重启的常见原因及排查方法。包括资源限制、健康检查配置、应用崩溃等方面的分析，以及通过 kubectl describe 和日志分析等方式进行故障排查。",
        tags: ["kubernetes", "pod", "restart", "troubleshooting"],
        createdAt: "2023-02-10T10:15:00Z",
        updatedAt: "2023-04-12T09:20:00Z",
      },
      {
        id: "kb-003",
        title: "MySQL 数据库性能优化指南",
        content: "本文介绍 MySQL 数据库性能优化的方法。包括索引优化、查询优化、配置调整、服务器参数设置等方面的内容，帮助提升数据库性能和稳定性。",
        tags: ["database", "mysql", "performance", "optimization"],
        createdAt: "2023-03-05T13:40:00Z",
        updatedAt: "2023-05-18T11:30:00Z",
      },
      {
        id: "kb-004",
        title: "Nginx 负载均衡配置最佳实践",
        content: "本文介绍 Nginx 负载均衡的配置方法和最佳实践。包括不同负载均衡算法的选择、健康检查配置、会话保持设置等内容，以及常见问题的解决方案。",
        tags: ["nginx", "load-balancing", "configuration", "best-practices"],
        createdAt: "2023-04-20T15:10:00Z",
        updatedAt: "2023-06-05T16:25:00Z",
      },
      {
        id: "kb-005",
        title: "Docker 容器网络问题排查指南",
        content: "本文介绍 Docker 容器网络问题的排查方法。包括容器网络模式、DNS 配置、端口映射、网络连通性测试等内容，以及常见网络问题的解决方案。",
        tags: ["docker", "networking", "troubleshooting", "container"],
        createdAt: "2023-05-12T09:50:00Z",
        updatedAt: "2023-07-08T14:15:00Z",
      },
    ];
    
    // 过滤知识条目
    let results = [...knowledgeEntries];
    
    // 根据查询过滤
    if (context.query) {
      const query = context.query.toLowerCase();
      results = results.filter(entry => 
        entry.title.toLowerCase().includes(query) || 
        entry.content.toLowerCase().includes(query) || 
        entry.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }
    
    // 根据标签过滤
    if (context.tags && context.tags.length > 0) {
      results = results.filter(entry => 
        context.tags!.some(tag => entry.tags.includes(tag))
      );
    }
    
    // 限制结果数量
    const limit = context.limit || 10;
    results = results.slice(0, limit);
    
    return {
      entries: results,
      count: results.length,
      query: context.query || "",
      tags: context.tags || [],
    };
  },
});

/**
 * 保存知识条目工具
 * 用于保存新的知识条目或更新现有知识
 */
export const saveKnowledgeEntryTool = createTool({
  id: "save-knowledge-entry",
  description: "保存新的知识条目或更新现有知识",
  inputSchema: z.object({
    id: z.string().optional().describe("知识条目ID，更新时需提供"),
    title: z.string().describe("知识条目标题"),
    content: z.string().describe("知识条目内容"),
    tags: z.array(z.string()).describe("知识条目标签"),
    author: z.string().optional().describe("作者"),
  }),
  execute: async ({ context }) => {
    // 模拟保存知识条目
    const now = new Date().toISOString();
    const id = context.id || `kb-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    const entry = {
      id,
      title: context.title,
      content: context.content,
      tags: context.tags,
      createdAt: context.id ? now : now, // 如果是更新，保持原创建时间
      updatedAt: now,
      author: context.author || "系统",
    };
    
    return {
      success: true,
      entry,
      message: context.id ? "知识条目更新成功" : "知识条目创建成功",
    };
  },
});

/**
 * 知识库工具集
 */
export const knowledgeBaseTools = {
  searchKnowledgeBase: searchKnowledgeBaseTool,
  saveKnowledgeEntry: saveKnowledgeEntryTool,
}; 