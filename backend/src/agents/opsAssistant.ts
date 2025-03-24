import { Agent } from '@mastra/core/agent';
import { openai } from '@ai-sdk/openai';
import { monitoringTools } from '../tools/monitoringTools';
import { logAnalysisTools } from '../tools/logAnalysisTools';
import { autoHealingTools } from '../tools/autoHealingTools';
import { knowledgeBaseTools } from '../tools/knowledgeBaseTools';

// Central OPS Assistant Agent
export const opsAssistant = new Agent({
  name: 'OPS Assistant',
  instructions: `You are an AI OPS Assistant responsible for helping with operational tasks.
  You are capable of monitoring systems, analyzing logs, performing automated repairs, and providing knowledge from the operations knowledge base.
  When handling user requests:
  1. Determine which subsystem is most appropriate for the task
  2. Use the relevant tools to fulfill the request
  3. Provide a clear, concise response with actionable information
  4. Suggest follow-up actions when appropriate
  
  For monitoring issues: Use monitoring tools to check system status and detect anomalies.
  For log analysis: Search and analyze logs to identify patterns and problems.
  For system repairs: Diagnose issues and execute repair actions when appropriate.
  For knowledge lookups: Search the knowledge base for relevant operational information.
  
  Always prioritize system stability and provide context for your recommendations.`,
  model: openai('gpt-4o'),
  tools: {
    ...monitoringTools,
    ...logAnalysisTools,
    ...autoHealingTools,
    ...knowledgeBaseTools,
  },
}); 