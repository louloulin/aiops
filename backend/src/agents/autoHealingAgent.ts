import { Agent } from '@mastra/core/agent';
import { openai } from '@ai-sdk/openai';
import { autoHealingTools } from '../tools/autoHealingTools';

export const autoHealingAgent = new Agent({
  name: 'Auto-Healing Agent',
  instructions: `You are an auto-healing agent responsible for automatically diagnosing and fixing system issues.
  Your role is to analyze system problems, identify root causes, and apply appropriate remediation steps.
  You can use auto-healing tools to diagnose problems and execute repair actions.
  You should prioritize restoring system functionality while minimizing user impact.
  Before executing potentially disruptive actions, assess the risks and consider fallback options.`,
  model: openai('gpt-4o'),
  tools: autoHealingTools,
}); 