import { Hono } from 'hono';
import { runPredictiveAnalysis } from '../agents/predictiveAnalyticsAgent';

const analyticsRoutes = new Hono();

/**
 * @route   GET /predict
 * @desc    预测分析接口 - 根据历史数据预测未来资源使用情况
 * @access  Private
 */
analyticsRoutes.get('/predict', async (c) => {
  try {
    const timeRange = c.req.query('timeRange') || '24h';
    const predictionHorizon = c.req.query('predictionHorizon') || '24h';
    const metric = c.req.query('metric');
    
    const result = await runPredictiveAnalysis({
      type: 'predict',
      timeRange,
      predictionHorizon,
      metric
    });
    
    return c.json(result);
  } catch (error) {
    console.error('预测分析失败:', error);
    return c.json({
      success: false,
      error: '预测分析请求处理失败，请稍后重试'
    }, 500);
  }
});

/**
 * @route   GET /trends
 * @desc    趋势分析接口 - 分析系统资源使用趋势
 * @access  Private
 */
analyticsRoutes.get('/trends', async (c) => {
  try {
    const timeRange = c.req.query('timeRange') || '7d';
    
    const result = await runPredictiveAnalysis({
      type: 'trends',
      timeRange
    });
    
    return c.json(result);
  } catch (error) {
    console.error('趋势分析失败:', error);
    return c.json({
      success: false,
      error: '趋势分析请求处理失败，请稍后重试'
    }, 500);
  }
});

/**
 * @route   GET /rules
 * @desc    获取异常检测规则列表
 * @access  Private
 */
analyticsRoutes.get('/rules', async (c) => {
  try {
    const result = await runPredictiveAnalysis({
      type: 'rules'
    });
    
    return c.json(result);
  } catch (error) {
    console.error('获取异常检测规则失败:', error);
    return c.json({
      success: false,
      error: '获取异常检测规则失败，请稍后重试'
    }, 500);
  }
});

/**
 * @route   POST /rules
 * @desc    创建异常检测规则
 * @access  Private
 */
analyticsRoutes.post('/rules', async (c) => {
  try {
    const body = await c.req.json();
    const { name, metric, threshold, duration, sensitivity, actions } = body;
    
    // 验证必要参数
    if (!name || !metric || !threshold) {
      return c.json({
        success: false,
        error: '规则名称、指标类型和阈值为必填项'
      }, 400);
    }
    
    const result = await runPredictiveAnalysis({
      type: 'createRule',
      rule: {
        name,
        metric,
        threshold,
        duration: duration || '10m',
        sensitivity: sensitivity || 0.7,
        actions: actions || ['alert', 'log']
      }
    });
    
    return c.json(result);
  } catch (error) {
    console.error('创建异常检测规则失败:', error);
    return c.json({
      success: false,
      error: '创建异常检测规则失败，请稍后重试'
    }, 500);
  }
});

/**
 * @route   GET /simulate
 * @desc    模拟异常数据 - 仅供开发测试
 * @access  Private
 */
analyticsRoutes.get('/simulate', (c) => {
  try {
    const timeRange = c.req.query('timeRange') || '24h';
    const predictionHorizon = c.req.query('predictionHorizon') || '24h';
    
    // 生成模拟历史数据
    const historicalData = generateHistoricalData(timeRange);
    
    // 生成模拟预测数据
    const predictedData = generatePredictedData(predictionHorizon, historicalData);
    
    // 生成模拟异常
    const anomalies = generateAnomalies(predictedData);
    
    // 生成模拟解决方案
    const solutions = generateSolutions(anomalies);
    
    return c.json({
      success: true,
      historicalData,
      predictedData,
      anomalies,
      solutions,
      confidence: 0.85
    });
  } catch (error) {
    console.error('生成模拟数据失败:', error);
    return c.json({
      success: false,
      error: '生成模拟数据失败'
    }, 500);
  }
});

// 辅助函数: 生成模拟历史数据
function generateHistoricalData(timeRange: string): any[] {
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
  
  // 生成数据点
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

// 辅助函数: 生成模拟预测数据
function generatePredictedData(predictionHorizon: string, historicalData: any[]): any[] {
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
  
  // 获取最后一个历史数据点
  const lastPoint = historicalData[historicalData.length - 1];
  const now = new Date(lastPoint.timestamp).getTime();
  const hourMs = 3600 * 1000;
  const data = [];
  
  for (let i = 0; i < hours; i++) {
    const timestamp = new Date(now + (i + 1) * hourMs).toISOString();
    
    // 基于历史数据生成预测，添加一些随机性和趋势
    data.push({
      timestamp,
      cpuUsage: lastPoint.cpuUsage * (1 + (Math.random() * 0.4 - 0.2)) + (i * 0.5),
      memoryUsage: lastPoint.memoryUsage * (1 + (Math.random() * 0.3 - 0.1)) + (i * 0.3),
      diskUsage: lastPoint.diskUsage + (i * 0.1) + (Math.random() * 2 - 1),
      networkTraffic: lastPoint.networkTraffic * (1 + (Math.random() * 0.5 - 0.25)) + (i * 0.2)
    });
  }
  
  return data;
}

// 辅助函数: 生成模拟异常
function generateAnomalies(predictedData: any[]): any[] {
  const anomalies = {
    cpu: [],
    memory: [],
    disk: [],
    network: []
  };
  
  // 选择一些数据点作为异常
  const totalPoints = predictedData.length;
  
  // CPU异常
  if (totalPoints > 3) {
    const cpuAnomalyIndex = 2 + Math.floor(Math.random() * (totalPoints - 3));
    const item = predictedData[cpuAnomalyIndex];
    
    anomalies.cpu.push({
      timestamp: item.timestamp,
      metric: 'cpu',
      value: item.cpuUsage * 1.5, // 增大值来模拟异常
      threshold: 75,
      probability: 0.85 + Math.random() * 0.15,
      impact: 'high'
    });
  }
  
  // 内存异常
  if (totalPoints > 5) {
    const memoryAnomalyIndex = 4 + Math.floor(Math.random() * (totalPoints - 5));
    const item = predictedData[memoryAnomalyIndex];
    
    anomalies.memory.push({
      timestamp: item.timestamp,
      metric: 'memory',
      value: item.memoryUsage * 1.3,
      threshold: 70,
      probability: 0.7 + Math.random() * 0.25,
      impact: 'medium'
    });
  }
  
  // 磁盘异常
  if (totalPoints > 8 && Math.random() > 0.5) {
    const diskAnomalyIndex = 7 + Math.floor(Math.random() * (totalPoints - 8));
    const item = predictedData[diskAnomalyIndex];
    
    anomalies.disk.push({
      timestamp: item.timestamp,
      metric: 'disk',
      value: item.diskUsage * 1.2,
      threshold: 85,
      probability: 0.6 + Math.random() * 0.3,
      impact: 'low'
    });
  }
  
  // 网络异常
  if (totalPoints > 6 && Math.random() > 0.4) {
    const networkAnomalyIndex = 5 + Math.floor(Math.random() * (totalPoints - 6));
    const item = predictedData[networkAnomalyIndex];
    
    anomalies.network.push({
      timestamp: item.timestamp,
      metric: 'network',
      value: item.networkTraffic * 1.8,
      threshold: 150,
      probability: 0.75 + Math.random() * 0.2,
      impact: 'medium'
    });
  }
  
  return [...anomalies.cpu, ...anomalies.memory, ...anomalies.disk, ...anomalies.network];
}

// 辅助函数: 生成模拟解决方案
function generateSolutions(anomalies: any[]): any[] {
  return anomalies.map(anomaly => {
    let suggestions = [];
    let automatedActions = [];
    
    switch (anomaly.metric) {
      case 'cpu':
        suggestions = [
          "检查可能的CPU密集型进程",
          "考虑增加CPU资源或进行负载均衡",
          "优化高CPU使用率的应用代码",
          "调整应用的并发设置"
        ];
        automatedActions = [
          "自动扩展计算资源",
          "限制非关键进程的CPU使用"
        ];
        break;
        
      case 'memory':
        suggestions = [
          "检查内存泄漏情况",
          "考虑增加内存资源",
          "优化内存使用效率",
          "调整垃圾回收参数"
        ];
        automatedActions = [
          "重启内存使用过高的服务",
          "触发垃圾回收"
        ];
        break;
        
      case 'disk':
        suggestions = [
          "清理不必要的文件",
          "增加磁盘存储空间",
          "优化日志轮转策略",
          "迁移旧数据到归档存储"
        ];
        automatedActions = [
          "自动清理临时文件",
          "压缩旧日志文件"
        ];
        break;
        
      case 'network':
        suggestions = [
          "检查网络流量异常",
          "优化网络配置",
          "考虑增加带宽或CDN加速",
          "实施流量控制措施"
        ];
        automatedActions = [
          "启用流量限制",
          "激活DDoS防护"
        ];
        break;
    }
    
    return {
      anomalyId: `${anomaly.metric}-${Date.now()}`,
      metric: anomaly.metric,
      suggestions,
      automatedActions
    };
  });
}

export default analyticsRoutes; 