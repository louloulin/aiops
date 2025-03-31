import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

/**
 * 诊断系统问题工具
 * 用于诊断系统问题并提供修复建议
 */
export const diagnoseProblemTool = createTool({
  id: 'diagnose-problem',
  description: '诊断系统问题并提供修复建议',
  inputSchema: z.object({
    issueDescription: z.string().describe('问题描述'),
    systemInfo: z.record(z.string(), z.any()).optional().describe('系统信息'),
    logs: z.array(z.any()).optional().describe('相关日志'),
    metrics: z.record(z.string(), z.any()).optional().describe('相关指标'),
  }),
  execute: async ({ context }) => {
    // 模拟诊断过程
    const problems = [
      {
        name: 'CPU使用率过高',
        signs: ['CPU使用率超过90%', '系统响应缓慢', '进程执行时间长'],
        solutions: ['识别CPU密集型进程', '优化代码', '扩展资源'],
      },
      {
        name: '内存泄漏',
        signs: ['内存使用率持续增长', '应用重启后内存使用恢复', '应用响应缓慢'],
        solutions: ['识别泄漏源', '更新依赖库', '重启应用'],
      },
      {
        name: '磁盘空间不足',
        signs: ['磁盘使用率高', '写入操作失败', '日志文件大小异常'],
        solutions: ['清理日志文件', '扩展存储空间', '优化存储策略'],
      },
      {
        name: '数据库连接问题',
        signs: ['连接超时', '数据库错误日志', '查询执行缓慢'],
        solutions: ['检查数据库服务状态', '优化连接池', '重启数据库服务'],
      },
      {
        name: '网络连接问题',
        signs: ['连接超时', '网络错误', '延迟增高'],
        solutions: ['检查网络配置', '重启网络服务', '更新DNS配置'],
      },
    ];
    
    // 随机选择一个问题或根据描述匹配
    let problem = problems[Math.floor(Math.random() * problems.length)];
    
    // 如果有问题描述，尝试匹配最相关的问题
    if (context.issueDescription) {
      const desc = context.issueDescription.toLowerCase();
      const matchedProblem = problems.find(p => 
        desc.includes(p.name.toLowerCase()) || 
        p.signs.some(s => desc.includes(s.toLowerCase()))
      );
      
      if (matchedProblem) {
        problem = matchedProblem;
      }
    }
    
    return {
      diagnosis: {
        problemType: problem.name,
        confidence: 0.8,
        signs: problem.signs,
        possibleCauses: [
          '资源争用',
          '配置错误',
          '软件缺陷',
          '硬件故障',
        ],
        recommendedSolutions: problem.solutions,
      },
      severity: '高',
      estimatedResolutionTime: '30分钟',
    };
  },
});

/**
 * 执行修复操作工具
 * 用于执行系统修复操作
 */
export const executeRemediationTool = createTool({
  id: 'execute-remediation',
  description: '执行系统修复操作',
  inputSchema: z.object({
    problemType: z.string().describe('问题类型'),
    action: z.string().describe('修复操作'),
    target: z.string().optional().describe('目标系统或组件'),
    parameters: z.record(z.string(), z.any()).optional().describe('操作参数'),
  }),
  execute: async ({ context }) => {
    // 模拟执行修复操作
    const actions: Record<string, { success: boolean; message: string; details: string }> = {
      '重启服务': {
        success: true,
        message: `成功重启服务 ${context.target || '应用服务'}`,
        details: '服务已恢复正常运行',
      },
      '清理缓存': {
        success: true,
        message: `成功清理 ${context.target || '系统'} 缓存`,
        details: '缓存已清理，系统性能已恢复',
      },
      '释放内存': {
        success: true,
        message: `成功释放 ${context.target || '应用'} 内存`,
        details: '内存使用率已降至正常水平',
      },
      '优化数据库': {
        success: true,
        message: `成功优化 ${context.target || '主'} 数据库`,
        details: '数据库查询性能已提升',
      },
      '扩展资源': {
        success: true,
        message: `成功为 ${context.target || '系统'} 分配更多资源`,
        details: '资源容量已增加，系统负载已平衡',
      },
    };
    
    // 默认修复结果
    let result = {
      success: false,
      message: '未知修复操作',
      details: '请指定有效的修复操作',
    };
    
    // 如果有匹配的操作，返回对应结果
    if (context.action && actions[context.action]) {
      result = actions[context.action];
    }
    
    return {
      ...result,
      timestamp: new Date().toISOString(),
      actionTaken: context.action,
      target: context.target || '系统',
      problemType: context.problemType,
    };
  },
});

/**
 * 验证修复结果工具
 * 用于验证修复操作是否解决了问题
 */
export const verifyRemediationTool = createTool({
  id: 'verify-remediation',
  description: '验证修复操作是否解决了问题',
  inputSchema: z.object({
    problemType: z.string().describe('问题类型'),
    action: z.string().describe('执行的修复操作'),
    target: z.string().optional().describe('目标系统或组件'),
    checkTimeoutSeconds: z.number().optional().describe('检查超时时间（秒）'),
  }),
  execute: async ({ context }) => {
    // 模拟验证过程
    type VerificationResult = {
      success: boolean;
      metrics: {
        before: Record<string, string>;
        after: Record<string, string>;
      };
    };
    
    const verificationResults: Record<string, VerificationResult> = {
      'CPU使用率过高': {
        success: true,
        metrics: {
          before: { cpu: '95%' },
          after: { cpu: '45%' },
        },
      },
      '内存泄漏': {
        success: true,
        metrics: {
          before: { memory: '90%' },
          after: { memory: '60%' },
        },
      },
      '磁盘空间不足': {
        success: true,
        metrics: {
          before: { disk: '95%' },
          after: { disk: '70%' },
        },
      },
      '数据库连接问题': {
        success: true,
        metrics: {
          before: { connections: '0', responseTime: '超时' },
          after: { connections: '10', responseTime: '120ms' },
        },
      },
      '网络连接问题': {
        success: true,
        metrics: {
          before: { latency: '500ms', packetLoss: '15%' },
          after: { latency: '80ms', packetLoss: '0%' },
        },
      },
    };
    
    // 默认验证结果
    const defaultResult: VerificationResult = {
      success: Math.random() > 0.2, // 80% 的概率成功
      metrics: {
        before: { status: '异常' },
        after: { status: '正常' },
      },
    };
    
    // 获取匹配的验证结果或使用默认结果
    const result = verificationResults[context.problemType] || defaultResult;
    
    return {
      verified: result.success,
      status: result.success ? '已解决' : '未解决',
      metrics: result.metrics,
      action: context.action,
      target: context.target || '系统',
      problemType: context.problemType,
      verificationTime: new Date().toISOString(),
      message: result.success 
        ? `${context.action}操作成功解决了${context.problemType}问题` 
        : `${context.action}操作未能完全解决${context.problemType}问题，可能需要进一步操作`,
    };
  },
});

/**
 * 自动修复工具集
 */
export const autoHealingTools = {
  diagnoseProblem: diagnoseProblemTool,
  executeRemediation: executeRemediationTool,
  verifyRemediation: verifyRemediationTool,
}; 