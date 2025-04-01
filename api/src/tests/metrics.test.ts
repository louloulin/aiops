import fetch from 'node-fetch';

/**
 * 系统指标API测试脚本
 * 
 * 请先启动API服务，然后运行此测试脚本
 * ```
 * cd api
 * bun run test:metrics
 * ```
 */

const API_BASE_URL = 'http://localhost:9700/api';

async function runTests() {
  console.log('开始测试系统指标API...');
  
  try {
    // 1. 测试生成模拟数据
    console.log('\n1. 测试生成模拟数据...');
    const mockResponse = await fetch(`${API_BASE_URL}/metrics/system/mock`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        count: 5,
        variation: 0.2,
      }),
    });
    
    const mockData = await mockResponse.json();
    console.log('模拟数据生成结果:', mockData.success ? '成功' : '失败');
    if (mockData.success) {
      console.log('样本数据:', mockData.sampleData);
    } else {
      console.error('错误:', mockData.error);
    }
    
    // 2. 测试获取系统指标
    console.log('\n2. 测试获取系统指标...');
    const metricsResponse = await fetch(`${API_BASE_URL}/metrics/system?limit=3`);
    const metricsData = await metricsResponse.json();
    
    console.log('获取指标结果:', metricsData.success ? '成功' : '失败');
    if (metricsData.success) {
      console.log(`获取到 ${metricsData.count} 条指标数据`);
      console.log('最新指标:', metricsData.metrics[0]);
    } else {
      console.error('错误:', metricsData.error);
    }
    
    // 3. 测试分析系统指标
    console.log('\n3. 测试分析系统指标...');
    const analysisResponse = await fetch(`${API_BASE_URL}/metrics/system/analyze`);
    const analysisData = await analysisResponse.json();
    
    console.log('分析结果:', analysisData.success ? '成功' : '失败');
    if (analysisData.success) {
      console.log('平均CPU使用率:', analysisData.analysis.metrics.averageCpuUsage);
      console.log('平均内存使用率:', analysisData.analysis.metrics.averageMemoryUsage);
      console.log('平均磁盘使用率:', analysisData.analysis.metrics.averageDiskUsage);
      console.log('检测到异常:', analysisData.analysis.hasAnomalies ? '是' : '否');
      
      if (analysisData.analysis.hasAnomalies) {
        console.log('异常:', analysisData.analysis.anomalies);
        console.log('建议操作:', analysisData.analysis.recommendedActions);
      }
    } else {
      console.error('错误:', analysisData.error);
    }
    
    console.log('\n所有测试完成!');
  } catch (error) {
    console.error('测试过程中出错:', error);
  }
}

// 运行测试
runTests(); 