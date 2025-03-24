import { Agent } from "@mastra/core/agent";
import { openaiClient, PROMPTS, PROMPT_TYPES } from "../mastra";
import { logAnalysisTools } from "../tools/logAnalysisTools";

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
 * 日志分析智能体
 * 负责分析系统日志，识别异常和错误模式，并提供排查思路
 */
export const logAnalysisAgent = new Agent({
  name: "Log Analysis Agent",
  instructions: PROMPTS[PROMPT_TYPES.LOG_ANALYSIS],
  model: openaiClient,
  tools: logAnalysisTools,
});

/**
 * 分析日志数据
 * @param logs 日志条目数组
 * @returns 分析结果，包括洞察、异常模式和建议
 */
export async function analyzeLogData(logs: LogEntry[]) {
  // 格式化日志数据
  const formattedLogs = logs.map(log => 
    `[${log.timestamp}] [${log.level.toUpperCase()}] ${log.service ? `[${log.service}] ` : ''}${log.message}`
  ).join('\n');
  
  // 生成日志摘要
  const summary = {
    total: logs.length,
    byLevel: {} as Record<string, number>,
    byService: {} as Record<string, number>,
  };
  
  // 统计不同级别的日志数量
  logs.forEach(log => {
    summary.byLevel[log.level] = (summary.byLevel[log.level] || 0) + 1;
    if (log.service) {
      summary.byService[log.service] = (summary.byService[log.service] || 0) + 1;
    }
  });
  
  // 提取错误和警告日志
  const errorLogs = logs.filter(log => log.level === 'error' || log.level === 'critical');
  const warningLogs = logs.filter(log => log.level === 'warn');
  
  // 使用日志分析代理分析日志
  const prompt = `
  请分析以下系统日志，识别主要问题、异常模式，并提供排查思路：
  
  日志总数: ${logs.length}
  错误日志数: ${errorLogs.length}
  警告日志数: ${warningLogs.length}
  
  日志样本:
  ${formattedLogs.length > 3000 ? formattedLogs.substring(0, 3000) + '...(已截断)' : formattedLogs}
  
  请提供以下分析：
  1. 主要问题概述
  2. 异常模式识别
  3. 可能的根本原因
  4. 排查建议和解决方案
  `;
  
  const response = await logAnalysisAgent.generate([
    { role: "user", content: prompt }
  ]);
  
  // 处理返回结果
  const analysisText = typeof response === 'string' ? response : JSON.stringify(response);
  
  // 从分析文本中提取各部分内容
  const problemsMatch = analysisText.match(/主要问题[：:]([\s\S]*?)(?=异常模式[：:]|$)/i);
  const patternsMatch = analysisText.match(/异常模式[：:]([\s\S]*?)(?=根本原因[：:]|$)/i);
  const causesMatch = analysisText.match(/根本原因[：:]([\s\S]*?)(?=排查建议[：:]|$)/i);
  const recommendationsMatch = analysisText.match(/排查建议[：:]([\s\S]*?)(?=$)/i);
  
  // 提取并格式化内容
  const problems = problemsMatch 
    ? problemsMatch[1].split(/\n/).filter(line => line.trim()).map(line => line.trim().replace(/^[\d\.\-\*•]+\s*/, ''))
    : [];
  
  const patterns = patternsMatch 
    ? patternsMatch[1].split(/\n/).filter(line => line.trim()).map(line => line.trim().replace(/^[\d\.\-\*•]+\s*/, ''))
    : [];
  
  const causes = causesMatch 
    ? causesMatch[1].split(/\n/).filter(line => line.trim()).map(line => line.trim().replace(/^[\d\.\-\*•]+\s*/, ''))
    : [];
  
  const recommendations = recommendationsMatch 
    ? recommendationsMatch[1].split(/\n/).filter(line => line.trim()).map(line => line.trim().replace(/^[\d\.\-\*•]+\s*/, ''))
    : [];
  
  return {
    summary,
    analysis: {
      problems,
      patterns,
      causes,
      recommendations
    },
    errorCount: errorLogs.length,
    warningCount: warningLogs.length,
    timestamp: new Date().toISOString(),
  };
} 