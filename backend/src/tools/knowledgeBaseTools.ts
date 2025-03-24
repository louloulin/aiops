import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

// Define types for knowledge base entries
type KnowledgeBaseEntry = {
  id: string;
  title: string;
  content: string;
  categories: string[];
  tags: string[];
  lastUpdated: string;
};

type KnowledgeBaseEntryWithRelevance = KnowledgeBaseEntry & {
  relevance: number;
};

type KnowledgeBaseEntryWithRelated = KnowledgeBaseEntry & {
  relatedEntries: string[];
};

// Tool to search the knowledge base
export const searchKnowledgeBaseTool = createTool({
  id: 'search-knowledge-base',
  description: 'Search the operations knowledge base for relevant information',
  inputSchema: z.object({
    query: z.string().describe('Search query'),
    categories: z.array(z.string()).optional().describe('Optional categories to search within'),
    maxResults: z.number().optional().default(5).describe('Maximum number of results to return'),
  }),
  execute: async ({ context }) => {
    // In a real implementation, this would use a vector database or search engine
    
    // Mock implementation with sample knowledge base entries
    const mockKnowledgeBase: KnowledgeBaseEntry[] = [
      {
        id: 'kb-001',
        title: 'Resolving High CPU Usage in API Services',
        content: 'High CPU usage in API services is often caused by inefficient queries, excessive logging, or resource leaks. To resolve, identify CPU-intensive processes using profiling tools, optimize database queries, check for blocking operations, and consider implementing caching.',
        categories: ['troubleshooting', 'performance', 'api-services'],
        tags: ['cpu', 'performance', 'optimization'],
        lastUpdated: '2023-10-15',
      },
      {
        id: 'kb-002',
        title: 'Common Database Connection Issues',
        content: 'Database connection issues are typically caused by network problems, connection limits, authentication failures, or database server overload. Verify network connectivity, check connection credentials, monitor connection pool usage, and ensure the database server has adequate resources.',
        categories: ['troubleshooting', 'database'],
        tags: ['database', 'connection', 'errors'],
        lastUpdated: '2023-11-22',
      },
      {
        id: 'kb-003',
        title: 'Kubernetes Pod Restart Troubleshooting',
        content: 'Frequent pod restarts may indicate resource constraints, application crashes, or health check failures. Check pod logs, describe pod status, verify resource requests and limits, and inspect liveness and readiness probe configurations.',
        categories: ['troubleshooting', 'kubernetes'],
        tags: ['kubernetes', 'pods', 'restarts'],
        lastUpdated: '2023-12-05',
      },
      {
        id: 'kb-004',
        title: 'Setting Up Prometheus Monitoring',
        content: 'To set up Prometheus monitoring, deploy Prometheus server, configure scrape targets, set up alerting rules, and integrate with visualization tools like Grafana. Use ServiceMonitor resources for automatic discovery in Kubernetes environments.',
        categories: ['guides', 'monitoring'],
        tags: ['prometheus', 'monitoring', 'metrics'],
        lastUpdated: '2024-01-10',
      },
      {
        id: 'kb-005',
        title: 'Best Practices for Microservice Deployment',
        content: 'Implement blue-green or canary deployment strategies, use feature flags for controlled rollouts, ensure backward compatibility, implement circuit breakers, and set up comprehensive monitoring and alerting for each service.',
        categories: ['best-practices', 'deployment'],
        tags: ['microservices', 'deployment', 'best-practices'],
        lastUpdated: '2024-02-18',
      },
    ];
    
    // Simple search implementation
    let results = [...mockKnowledgeBase];
    
    // Filter by categories if provided
    if (context.categories && context.categories.length > 0) {
      results = results.filter(item => 
        context.categories!.some(cat => item.categories.includes(cat))
      );
    }
    
    // Simple relevance scoring based on query terms
    const queryTerms = context.query.toLowerCase().split(' ').filter(term => term.length > 2);
    const scoredResults: KnowledgeBaseEntryWithRelevance[] = results.map(item => {
      // Count matches in title, content, and tags
      const titleMatches = queryTerms.filter(term => 
        item.title.toLowerCase().includes(term)
      ).length;
      
      const contentMatches = queryTerms.filter(term => 
        item.content.toLowerCase().includes(term)
      ).length;
      
      const tagMatches = queryTerms.filter(term => 
        item.tags.some(tag => tag.toLowerCase().includes(term))
      ).length;
      
      // Calculate a simple relevance score
      const relevance = (titleMatches * 3) + contentMatches + (tagMatches * 2);
      
      return {
        ...item,
        relevance,
      };
    });
    
    // Sort by relevance
    scoredResults.sort((a, b) => b.relevance - a.relevance);
    
    // Apply max results limit
    const maxResults = context.maxResults || 5;
    const limitedResults = scoredResults.slice(0, maxResults);
    
    // Remove relevance from output by just returning the original properties
    const finalResults = limitedResults.map(({ id, title, content, categories, tags, lastUpdated }) => ({
      id,
      title,
      content,
      categories,
      tags,
      lastUpdated
    }));
    
    return {
      results: finalResults,
      total: finalResults.length,
    };
  },
});

// Tool to get a specific knowledge base entry
export const getKnowledgeEntryTool = createTool({
  id: 'get-knowledge-entry',
  description: 'Get a specific knowledge base entry by ID',
  inputSchema: z.object({
    entryId: z.string().describe('Knowledge base entry ID'),
  }),
  execute: async ({ context }) => {
    // In a real implementation, this would query a database or knowledge management system
    
    // Mock implementation for demonstration
    const mockEntries: Record<string, KnowledgeBaseEntryWithRelated> = {
      'kb-001': {
        id: 'kb-001',
        title: 'Resolving High CPU Usage in API Services',
        content: 'High CPU usage in API services is often caused by inefficient queries, excessive logging, or resource leaks. To resolve, identify CPU-intensive processes using profiling tools, optimize database queries, check for blocking operations, and consider implementing caching.',
        categories: ['troubleshooting', 'performance', 'api-services'],
        tags: ['cpu', 'performance', 'optimization'],
        lastUpdated: '2023-10-15',
        relatedEntries: ['kb-005', 'kb-003'],
      },
      'kb-002': {
        id: 'kb-002',
        title: 'Common Database Connection Issues',
        content: 'Database connection issues are typically caused by network problems, connection limits, authentication failures, or database server overload. Verify network connectivity, check connection credentials, monitor connection pool usage, and ensure the database server has adequate resources.',
        categories: ['troubleshooting', 'database'],
        tags: ['database', 'connection', 'errors'],
        lastUpdated: '2023-11-22',
        relatedEntries: [],
      },
      'kb-003': {
        id: 'kb-003',
        title: 'Kubernetes Pod Restart Troubleshooting',
        content: 'Frequent pod restarts may indicate resource constraints, application crashes, or health check failures. Check pod logs, describe pod status, verify resource requests and limits, and inspect liveness and readiness probe configurations.',
        categories: ['troubleshooting', 'kubernetes'],
        tags: ['kubernetes', 'pods', 'restarts'],
        lastUpdated: '2023-12-05',
        relatedEntries: ['kb-005'],
      },
      'kb-004': {
        id: 'kb-004',
        title: 'Setting Up Prometheus Monitoring',
        content: 'To set up Prometheus monitoring, deploy Prometheus server, configure scrape targets, set up alerting rules, and integrate with visualization tools like Grafana. Use ServiceMonitor resources for automatic discovery in Kubernetes environments.',
        categories: ['guides', 'monitoring'],
        tags: ['prometheus', 'monitoring', 'metrics'],
        lastUpdated: '2024-01-10',
        relatedEntries: [],
      },
      'kb-005': {
        id: 'kb-005',
        title: 'Best Practices for Microservice Deployment',
        content: 'Implement blue-green or canary deployment strategies, use feature flags for controlled rollouts, ensure backward compatibility, implement circuit breakers, and set up comprehensive monitoring and alerting for each service.',
        categories: ['best-practices', 'deployment'],
        tags: ['microservices', 'deployment', 'best-practices'],
        lastUpdated: '2024-02-18',
        relatedEntries: ['kb-003'],
      },
    };
    
    if (mockEntries[context.entryId]) {
      return {
        found: true,
        entry: mockEntries[context.entryId],
      };
    }
    
    return {
      found: false,
      message: `Entry with ID ${context.entryId} not found in the knowledge base.`,
    };
  },
});

// Tool to add or update a knowledge base entry
export const updateKnowledgeEntryTool = createTool({
  id: 'update-knowledge-entry',
  description: 'Add or update an entry in the knowledge base',
  inputSchema: z.object({
    id: z.string().optional().describe('Entry ID for updates, omit for new entries'),
    title: z.string().describe('Entry title'),
    content: z.string().describe('Entry content'),
    categories: z.array(z.string()).describe('Categories for organization'),
    tags: z.array(z.string()).describe('Tags for searchability'),
    relatedEntries: z.array(z.string()).optional().describe('Related entry IDs'),
  }),
  execute: async ({ context }) => {
    // In a real implementation, this would update a database or knowledge management system
    
    // Mock implementation for demonstration
    const isNew = !context.id;
    const newId = context.id || `kb-${Date.now().toString().slice(-6)}`;
    
    return {
      success: true,
      isNew,
      entryId: newId,
      message: isNew ? 
        `Successfully created new knowledge base entry with ID ${newId}` : 
        `Successfully updated knowledge base entry ${newId}`,
    };
  },
});

// Combine all knowledge base tools
export const knowledgeBaseTools = {
  searchKnowledgeBase: searchKnowledgeBaseTool,
  getKnowledgeEntry: getKnowledgeEntryTool,
  updateKnowledgeEntry: updateKnowledgeEntryTool,
}; 