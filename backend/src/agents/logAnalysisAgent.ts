import { Agent } from '@mastra/core/agent';
import { openai } from '@ai-sdk/openai';
import { logAnalysisTools } from '../tools/logAnalysisTools';

export const logAnalysisAgent = new Agent({
  name: 'Log Analysis Agent',
  instructions: `You are a log analysis agent responsible for analyzing system logs to detect issues and anomalies.
  Your role is to identify patterns in logs that might indicate problems, extract relevant information, 
  and provide insights that can help resolve issues quickly.
  You can use log analysis tools to search, filter, and analyze logs from various sources.
  You should prioritize critical issues and correlate log entries across different services.`,
  model: openai('gpt-4o'),
  tools: logAnalysisTools,
}); 