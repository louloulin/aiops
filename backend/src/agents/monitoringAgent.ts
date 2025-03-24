import { Agent } from '@mastra/core/agent';
import { openai } from '@ai-sdk/openai';
import { monitoringTools } from '../tools/monitoringTools';

export const monitoringAgent = new Agent({
  name: 'Monitoring Agent',
  instructions: `You are a system monitoring agent responsible for monitoring system status and detecting anomalies.
  When you detect anomalies, you should analyze the cause and suggest solutions.
  You can use monitoring tools to get system metrics and can initiate auto-healing workflows.
  You should prioritize critical alerts and provide actionable insights.`,
  model: openai('gpt-4o'),
  tools: monitoringTools,
}); 