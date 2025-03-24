import { Hono } from 'hono';
import { z } from 'zod';
import { agents } from '../index';

const agentRoutes = new Hono();

// Validate message schema
const messageSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty'),
  conversationId: z.string().optional(),
  agentType: z.enum(['ops', 'monitoring', 'logs', 'autoheal', 'knowledge']).default('ops'),
});

// Agent conversation endpoint
agentRoutes.post('/chat', async (c) => {
  const body = await c.req.json();
  
  // Validate the request body
  const result = messageSchema.safeParse(body);
  if (!result.success) {
    return c.json(
      { error: 'Invalid request', details: result.error.format() },
      { status: 400 }
    );
  }
  
  const { message, conversationId, agentType } = result.data;
  
  try {
    // Select the appropriate agent based on type
    const agent = getAgentByType(agentType);
    
    // Format message for the agent
    const formattedMessage = {
      role: "user",
      content: message
    };
    
    // Process the message with the agent using the Mastra API
    let response;
    
    if (conversationId) {
      const resourceId = `conv:${conversationId}`;
      const threadId = conversationId;
      
      response = await agent.generate([formattedMessage], {
        resourceId,
        threadId
      });
    } else {
      // Simple generate call without memory context
      response = await agent.generate([formattedMessage]);
    }
    
    // Extract response content and conversation ID
    const responseContent = typeof response === 'string' 
      ? response 
      : JSON.stringify(response);
    
    const responseConversationId = conversationId || 
      generateConversationId();
    
    return c.json({
      response: responseContent,
      conversationId: responseConversationId,
    });
  } catch (error) {
    console.error('Agent processing error:', error);
    return c.json(
      { error: 'Failed to process message with AI agent' },
      { status: 500 }
    );
  }
});

// Helper function to generate a conversation ID if one isn't provided
function generateConversationId() {
  return `conv_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
}

// Agent types endpoint
agentRoutes.get('/types', (c) => {
  return c.json({
    types: [
      {
        id: 'ops',
        name: 'OPS Assistant',
        description: 'General-purpose operations assistant that can help with various operational tasks',
      },
      {
        id: 'monitoring',
        name: 'Monitoring Agent',
        description: 'Specialized agent for monitoring system status and detecting anomalies',
      },
      {
        id: 'logs',
        name: 'Log Analysis Agent',
        description: 'Specialized agent for analyzing logs and identifying patterns and issues',
      },
      {
        id: 'autoheal',
        name: 'Auto-Healing Agent',
        description: 'Specialized agent for diagnosing and automatically fixing system issues',
      },
      {
        id: 'knowledge',
        name: 'Knowledge Base Agent',
        description: 'Specialized agent for searching and managing the operations knowledge base',
      },
    ],
  });
});

// Select agent by type
function getAgentByType(type: string) {
  switch (type) {
    case 'monitoring':
      return agents.monitoringAgent;
    case 'logs':
      return agents.logAnalysisAgent;
    case 'autoheal':
      return agents.autoHealingAgent;
    case 'knowledge':
      return agents.knowledgeBaseAgent;
    case 'ops':
    default:
      return agents.opsAssistant;
  }
}

export { agentRoutes }; 