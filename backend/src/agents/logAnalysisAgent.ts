import { Agent } from "@mastra/core/agent";
import { openaiClient, PROMPTS, PROMPT_TYPES } from "../mastra";
import { logAnalysisTools } from "../tools/logAnalysisTools";

/**
 * 日志分析代理
 * 
 * 负责分析系统日志并找出问题。
 * 识别日志中的异常模式，关联多个相关日志，并提出可能的解决方案。
 */
export const logAnalysisAgent = new Agent({
  name: "Log Analysis Agent",
  instructions: PROMPTS[PROMPT_TYPES.LOG_ANALYSIS],
  model: openaiClient,
  tools: logAnalysisTools,
});

/**
 * 日志条目接口
 */
export interface LogEntry {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error' | 'critical';
  message: string;
  service?: string;
  context?: Record<string, any>;
}

/**
 * 分析系统日志
 * @param logs 日志条目列表
 * @returns 分析结果
 */
export async function analyzeSystemLogs(logs: LogEntry[]) {
  const response = await logAnalysisAgent.generate([
    {
      role: "user",
      content: `请分析以下系统日志，找出异常、错误模式，并提出可能的解决方案：\n${JSON.stringify(logs, null, 2)}`,
    }
  ]);

  return {
    analysis: response.text,
    logs,
    timestamp: new Date().toISOString(),
  };
} 