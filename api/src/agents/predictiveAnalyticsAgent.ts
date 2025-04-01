import { Agent } from "@mastra/core/agent";
import { openaiClient } from "../mastra";

/**
 * 预测分析代理 - 负责分析系统指标，预测未来趋势，检测异常并提供优化建议
 */
export const predictiveAnalyticsAgent = new Agent({
  name: "Predictive Analytics Agent",
  instructions: `你是一个专门负责系统指标分析和预测的AI助手。你的职责包括：

    1. 分析历史系统指标数据（CPU、内存、磁盘、网络）
    2. 预测未来一段时间内的资源使用情况
    3. 检测潜在的异常和性能瓶颈
    4. 提供系统优化和资源扩展建议
    5. 识别性能趋势和模式
    
    任务处理流程：
    1. 当收到分析请求后，首先获取指定时间范围的历史数据
    2. 根据历史数据生成未来预测
    3. 分析预测数据，检测可能的异常
    4. 针对检测到的异常，生成解决方案建议
    5. 返回完整的分析报告，包括历史数据、预测数据、异常检测和建议

    注意：
    - 预测应考虑历史模式、趋势和季节性因素
    - 异常检测应关注超出正常范围的指标值
    - 优化建议应具体、可操作，并针对检测到的问题
    - 分析报告应清晰、专业，易于运维人员理解`,
  model: openaiClient,
});

/**
 * 运行预测分析任务
 * @param task 任务参数
 * @returns 分析结果
 */
export async function runPredictiveAnalysis(task: any) {
  const { type = 'predict', timeRange = '24h', predictionHorizon = '24h', metric, sensitivityLevel = 0.7 } = task;

  try {
    // 根据任务类型执行不同的分析
    switch (type) {
      case 'trends': {
        // 返回模拟的趋势数据
        const response = await predictiveAnalyticsAgent.generate([
          {
            role: 'user',
            content: `分析过去${timeRange}内的系统资源使用趋势`
          }
        ]);

        return {
          success: true,
          trends: {
            analysis: response
          }
        };
      }

      case 'rules': {
        // 返回模拟的异常检测规则
        return {
          success: true,
          rules: [
            {
              id: 'rule-1',
              name: 'CPU高使用率检测',
              metric: 'cpu',
              threshold: 80,
              duration: '5m',
              sensitivity: 0.7,
              actions: ['alert', 'log'],
              createdAt: new Date().toISOString(),
              enabled: true
            },
            {
              id: 'rule-2',
              name: '内存使用率增长检测',
              metric: 'memory',
              threshold: 75,
              duration: '10m',
              sensitivity: 0.8,
              actions: ['alert', 'log', 'restart-service'],
              createdAt: new Date().toISOString(),
              enabled: true
            },
            {
              id: 'rule-3',
              name: '磁盘空间预警',
              metric: 'disk',
              threshold: 90,
              duration: '30m',
              sensitivity: 0.6,
              actions: ['alert', 'log', 'cleanup'],
              createdAt: new Date().toISOString(),
              enabled: true
            }
          ]
        };
      }

      case 'createRule': {
        // 创建新的异常检测规则
        if (!task.rule || !task.rule.name || !task.rule.metric || !task.rule.threshold) {
          return {
            success: false,
            error: '规则信息不完整'
          };
        }
        
        // 模拟创建规则
        const newRule = {
          id: `rule-${Date.now()}`,
          ...task.rule,
          createdAt: new Date().toISOString(),
          enabled: true
        };
        
        return {
          success: true,
          rule: newRule
        };
      }

      default: {
        // 执行预测分析
        // 使用客户端工具直接生成响应
        const response = await predictiveAnalyticsAgent.generate([
          {
            role: 'system',
            content: `请根据历史数据分析并预测未来${predictionHorizon}的系统指标。` +
                    `重点关注${metric || '所有指标'}，敏感度设置为${sensitivityLevel}`
          }, 
          {
            role: 'user',
            content: `请预测系统在未来${predictionHorizon}内的性能趋势，并提供可能的优化建议。`
          }
        ]);

        // 为API保持一致的返回格式
        return {
          success: true,
          historicalData: [], // 实际项目中应返回真实数据
          predictedData: [],  // 实际项目中应返回真实预测
          anomalies: {},      // 实际项目中应返回检测到的异常
          solutions: [],      // 实际项目中应返回解决方案建议
          confidence: 0.85,   // 预测置信度
          analysis: response  // 模型生成的分析
        };
      }
    }
  } catch (error: any) {
    console.error('预测分析任务执行失败:', error);
    return {
      success: false,
      error: error.message || '预测分析任务执行失败'
    };
  }
} 