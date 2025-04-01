import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { db } from "../db";

// 定义系统指标类型
interface SystemMetric {
  id?: string;
  timestamp?: string;
  createdAt?: Date;
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkTraffic: number;
}

// 定义异常类型
interface Anomaly {
  id?: string;
  timestamp: string;
  metric: string;
  value: number;
  threshold: number;
  probability: number;
  impact: 'low' | 'medium' | 'high';
}

/**
 * 获取历史数据工具
 * 从数据库检索指定时间范围的历史系统指标
 */
const fetchHistoricalDataTool = createTool({
  name: 'fetch-historical-data',
  description: '获取指定时间范围的历史系统指标数据',
  schema: z.object({
    timeRange: z.string().describe('数据时间范围，如 24h, 3d, 7d')
  }),
  execute: async ({ timeRange }) => {
    // 解析时间范围
    const duration = parseInt(timeRange);
    const unit = timeRange.slice(-1);
    
    let hours;
    if (unit === 'h') {
      hours = duration;
    } else if (unit === 'd') {
      hours = duration * 24;
    } else {
      hours = 24; // 默认24小时
    }
    
    try {
      // 计算起始时间
      const startTime = new Date();
      startTime.setHours(startTime.getHours() - hours);
      
      // 从数据库获取历史数据
      // 这里使用模拟数据，实际应用中应从数据库获取
      const data = generateMockHistoricalData(hours);
      
      return data;
    } catch (error) {
      console.error('获取历史数据失败:', error);
      throw new Error('获取历史数据失败');
    }
  }
});

/**
 * 预测资源使用工具
 * 基于历史数据预测未来资源使用情况
 */
const predictResourceUsageTool = createTool({
  name: 'predict-resource-usage',
  description: '基于历史数据预测未来资源使用情况',
  schema: z.object({
    historicalData: z.array(z.any()).describe('历史系统指标数据'),
    predictionHorizon: z.string().describe('预测时间范围，如 24h, 3d'),
    metric: z.string().optional().describe('要预测的特定指标，可选')
  }),
  execute: async ({ historicalData, predictionHorizon, metric }) => {
    try {
      // 解析预测时间范围
      const duration = parseInt(predictionHorizon);
      const unit = predictionHorizon.slice(-1);
      
      let hours;
      if (unit === 'h') {
        hours = duration;
      } else if (unit === 'd') {
        hours = duration * 24;
      } else {
        hours = 24; // 默认24小时
      }
      
      // 生成预测数据（简单示例）
      const predictedData = generateMockPredictedData(hours, historicalData);
      
      return {
        predictedData,
        confidence: 0.85 // 预测置信度
      };
    } catch (error) {
      console.error('预测资源使用失败:', error);
      throw new Error('预测资源使用失败');
    }
  }
});

/**
 * 检测异常工具
 * 检测预测数据中的潜在异常
 */
const detectAnomaliesTool = createTool({
  name: 'detect-anomalies',
  description: '检测预测数据中的潜在异常',
  schema: z.object({
    historicalData: z.array(z.any()).describe('历史系统指标数据'),
    predictedData: z.array(z.any()).describe('预测系统指标数据'),
    sensitivityLevel: z.number().min(0).max(1).default(0.7).describe('异常检测敏感度，值越高检测越严格')
  }),
  execute: async ({ historicalData, predictedData, sensitivityLevel }) => {
    try {
      // 检测异常（简单示例）
      const anomalies = detectMockAnomalies(predictedData, sensitivityLevel);
      
      return {
        anomalies
      };
    } catch (error) {
      console.error('检测异常失败:', error);
      throw new Error('检测异常失败');
    }
  }
});

/**
 * 生成解决方案工具
 * 为检测到的异常生成解决方案建议
 */
const generateSolutionsTool = createTool({
  name: 'generate-solutions',
  description: '为检测到的异常生成解决方案建议',
  schema: z.object({
    anomalies: z.array(z.any()).describe('检测到的异常列表')
  }),
  execute: async ({ anomalies }) => {
    try {
      // 生成解决方案（简单示例）
      const solutions = generateMockSolutions(anomalies);
      
      return {
        solutions
      };
    } catch (error) {
      console.error('生成解决方案失败:', error);
      throw new Error('生成解决方案失败');
    }
  }
});

// 导出工具集
export const predictiveTools = [
  fetchHistoricalDataTool,
  predictResourceUsageTool,
  detectAnomaliesTool,
  generateSolutionsTool
];

/**
 * 生成模拟历史数据
 * @param hours 小时数
 * @returns 模拟历史数据
 */
function generateMockHistoricalData(hours: number) {
  const now = Date.now();
  const hourMs = 3600 * 1000;
  const data = [];
  
  for (let i = 0; i < hours; i++) {
    const timestamp = new Date(now - (hours - i) * hourMs).toISOString();
    
    data.push({
      timestamp,
      cpuUsage: 40 + Math.sin(i / 3) * 15 + Math.random() * 10,
      memoryUsage: 50 + Math.cos(i / 4) * 10 + Math.random() * 15,
      diskUsage: 60 + Math.sin(i / 6) * 5 + Math.random() * 5,
      networkTraffic: 30 + Math.cos(i / 2) * 20 + Math.random() * 10
    });
  }
  
  return data;
}

/**
 * 生成模拟预测数据
 * @param hours 预测小时数
 * @param historicalData 历史数据
 * @returns 模拟预测数据
 */
function generateMockPredictedData(hours: number, historicalData: any[]) {
  const lastDataPoint = historicalData[historicalData.length - 1];
  const now = new Date(lastDataPoint.timestamp).getTime();
  const hourMs = 3600 * 1000;
  const data = [];
  
  // 简单的趋势延续 + 一些随机波动
  let cpuTrend = (historicalData[historicalData.length - 1].cpuUsage - historicalData[0].cpuUsage) / historicalData.length;
  let memoryTrend = (historicalData[historicalData.length - 1].memoryUsage - historicalData[0].memoryUsage) / historicalData.length;
  let diskTrend = (historicalData[historicalData.length - 1].diskUsage - historicalData[0].diskUsage) / historicalData.length;
  let networkTrend = (historicalData[historicalData.length - 1].networkTraffic - historicalData[0].networkTraffic) / historicalData.length;
  
  for (let i = 1; i <= hours; i++) {
    const timestamp = new Date(now + i * hourMs).toISOString();
    
    // 添加随机波动和趋势
    data.push({
      timestamp,
      cpuUsage: Math.max(0, Math.min(100, lastDataPoint.cpuUsage + cpuTrend * i + Math.sin(i / 3) * 8 + (Math.random() - 0.5) * 10)),
      memoryUsage: Math.max(0, Math.min(100, lastDataPoint.memoryUsage + memoryTrend * i + Math.cos(i / 4) * 5 + (Math.random() - 0.5) * 7)),
      diskUsage: Math.max(0, Math.min(100, lastDataPoint.diskUsage + diskTrend * i + Math.sin(i / 10) * 2 + (Math.random() - 0.5) * 3)),
      networkTraffic: Math.max(0, lastDataPoint.networkTraffic + networkTrend * i + Math.cos(i / 6) * 15 + (Math.random() - 0.5) * 20)
    });
  }
  
  return data;
}

/**
 * 检测模拟异常
 * @param predictedData 预测数据
 * @param sensitivityLevel 敏感度
 * @returns 模拟异常列表
 */
function detectMockAnomalies(predictedData: any[], sensitivityLevel: number) {
  const anomalies = [];
  
  // CPU 阈值
  const cpuThreshold = 80 - (1 - sensitivityLevel) * 20;
  
  // 内存阈值
  const memoryThreshold = 75 - (1 - sensitivityLevel) * 15;
  
  // 磁盘阈值
  const diskThreshold = 90 - (1 - sensitivityLevel) * 10;
  
  // 网络阈值 (MB/s)
  const networkThreshold = 100 - (1 - sensitivityLevel) * 30;
  
  // 检测异常
  for (const point of predictedData) {
    // 检测 CPU 异常
    if (point.cpuUsage > cpuThreshold) {
      anomalies.push({
        timestamp: point.timestamp,
        metric: 'cpu',
        value: point.cpuUsage,
        threshold: cpuThreshold,
        probability: 0.7 + Math.random() * 0.3,
        impact: point.cpuUsage > 90 ? 'high' : (point.cpuUsage > 85 ? 'medium' : 'low')
      });
    }
    
    // 检测内存异常
    if (point.memoryUsage > memoryThreshold) {
      anomalies.push({
        timestamp: point.timestamp,
        metric: 'memory',
        value: point.memoryUsage,
        threshold: memoryThreshold,
        probability: 0.7 + Math.random() * 0.3,
        impact: point.memoryUsage > 85 ? 'high' : (point.memoryUsage > 80 ? 'medium' : 'low')
      });
    }
    
    // 检测磁盘异常
    if (point.diskUsage > diskThreshold) {
      anomalies.push({
        timestamp: point.timestamp,
        metric: 'disk',
        value: point.diskUsage,
        threshold: diskThreshold,
        probability: 0.7 + Math.random() * 0.3,
        impact: point.diskUsage > 95 ? 'high' : (point.diskUsage > 92 ? 'medium' : 'low')
      });
    }
    
    // 检测网络异常
    if (point.networkTraffic > networkThreshold) {
      anomalies.push({
        timestamp: point.timestamp,
        metric: 'network',
        value: point.networkTraffic,
        threshold: networkThreshold,
        probability: 0.7 + Math.random() * 0.3,
        impact: point.networkTraffic > 150 ? 'high' : (point.networkTraffic > 120 ? 'medium' : 'low')
      });
    }
  }
  
  return anomalies;
}

/**
 * 生成模拟解决方案
 * @param anomalies 异常列表
 * @returns 模拟解决方案列表
 */
function generateMockSolutions(anomalies: any[]) {
  const metricAnomalies = {
    cpu: anomalies.filter(a => a.metric === 'cpu'),
    memory: anomalies.filter(a => a.metric === 'memory'),
    disk: anomalies.filter(a => a.metric === 'disk'),
    network: anomalies.filter(a => a.metric === 'network')
  };
  
  const solutions = [];
  
  // CPU 异常解决方案
  if (metricAnomalies.cpu.length > 0) {
    solutions.push({
      metric: 'cpu',
      suggestions: [
        '检查CPU密集型进程并考虑优化或限制其资源占用',
        '评估是否需要扩展计算资源以满足需求增长',
        '调整任务调度，避免计算密集型任务同时运行'
      ],
      automatedActions: [
        '限制非关键进程的CPU使用率',
        '自动扩展计算资源（如适用）',
        '临时降低非核心服务的优先级'
      ]
    });
  }
  
  // 内存异常解决方案
  if (metricAnomalies.memory.length > 0) {
    solutions.push({
      metric: 'memory',
      suggestions: [
        '检查内存泄漏并优化应用程序内存使用',
        '增加系统内存或启用交换空间',
        '调整应用程序缓存大小和GC参数'
      ],
      automatedActions: [
        '重启内存使用过高的服务',
        '清理系统缓存',
        '启动内存分析工具定位问题'
      ]
    });
  }
  
  // 磁盘异常解决方案
  if (metricAnomalies.disk.length > 0) {
    solutions.push({
      metric: 'disk',
      suggestions: [
        '清理临时文件和日志文件',
        '扩展磁盘存储空间',
        '设置日志轮转和自动清理策略'
      ],
      automatedActions: [
        '清理超过30天的日志文件',
        '压缩大型文件',
        '分析磁盘空间占用情况'
      ]
    });
  }
  
  // 网络异常解决方案
  if (metricAnomalies.network.length > 0) {
    solutions.push({
      metric: 'network',
      suggestions: [
        '优化网络请求，减少不必要的数据传输',
        '实施流量控制和请求限流',
        '评估网络架构和带宽需求'
      ],
      automatedActions: [
        '限制非关键服务的网络带宽',
        '启用网络流量压缩',
        '分析网络流量模式'
      ]
    });
  }
  
  return solutions;
} 