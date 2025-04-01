<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import Chart from 'chart.js/auto';
import { API_BASE_URL } from '../config';

// 图表引用
const cpuChart = ref(null);
const memoryChart = ref(null);
const diskChart = ref(null);
const networkChart = ref(null);

// 图表实例
let cpuChartInstance: Chart | null = null;
let memoryChartInstance: Chart | null = null;
let diskChartInstance: Chart | null = null;
let networkChartInstance: Chart | null = null;

// 状态
const loading = ref(false);
const analyzing = ref(false);
const generating = ref(false);
const metrics = ref<any[]>([]);
const analysis = ref<any>(null);
const refreshInterval = ref<number | null>(null);

// 获取系统指标数据
const fetchMetrics = async () => {
  loading.value = true;
  try {
    const response = await fetch(`${API_BASE_URL}/metrics/system?limit=20`);
    const data = await response.json();
    
    if (data.success) {
      metrics.value = data.metrics.reverse(); // 反转以便最新的在最后
      updateCharts();
    } else {
      console.error('获取指标数据失败:', data.error);
    }
  } catch (error) {
    console.error('获取指标数据错误:', error);
  } finally {
    loading.value = false;
  }
};

// 分析系统指标
const analyzeMetrics = async () => {
  analyzing.value = true;
  try {
    const response = await fetch(`${API_BASE_URL}/metrics/system/analyze`);
    const data = await response.json();
    
    if (data.success) {
      analysis.value = data.analysis;
    } else {
      console.error('分析指标数据失败:', data.error);
    }
  } catch (error) {
    console.error('分析指标数据错误:', error);
  } finally {
    analyzing.value = false;
  }
};

// 生成模拟数据
const generateMockData = async () => {
  generating.value = true;
  try {
    const response = await fetch(`${API_BASE_URL}/metrics/system/mock`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        count: 10,
        variation: 0.2,
      }),
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('模拟数据生成成功:', data.message);
      // 自动刷新数据
      fetchMetrics();
    } else {
      console.error('生成模拟数据失败:', data.error);
    }
  } catch (error) {
    console.error('生成模拟数据错误:', error);
  } finally {
    generating.value = false;
  }
};

// 更新图表
const updateCharts = () => {
  if (metrics.value.length === 0) return;
  
  const labels = metrics.value.map(m => formatTime(m.createdAt));
  const cpuData = metrics.value.map(m => m.cpuUsage);
  const memoryData = metrics.value.map(m => (m.memoryUsed / m.memoryTotal) * 100);
  const diskData = metrics.value.map(m => (m.diskUsed / m.diskTotal) * 100);
  const networkInData = metrics.value.map(m => m.networkBytesIn / 1024); // KB
  const networkOutData = metrics.value.map(m => m.networkBytesOut / 1024); // KB
  
  // 更新CPU图表
  if (cpuChartInstance) {
    cpuChartInstance.data.labels = labels;
    cpuChartInstance.data.datasets[0].data = cpuData;
    cpuChartInstance.update();
  } else if (cpuChart.value) {
    cpuChartInstance = new Chart(cpuChart.value, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'CPU使用率 (%)',
          data: cpuData,
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 2,
          pointRadius: 3,
          tension: 0.3,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            max: 100
          }
        }
      }
    });
  }
  
  // 更新内存图表
  if (memoryChartInstance) {
    memoryChartInstance.data.labels = labels;
    memoryChartInstance.data.datasets[0].data = memoryData;
    memoryChartInstance.update();
  } else if (memoryChart.value) {
    memoryChartInstance = new Chart(memoryChart.value, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: '内存使用率 (%)',
          data: memoryData,
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 2,
          pointRadius: 3,
          tension: 0.3,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            max: 100
          }
        }
      }
    });
  }
  
  // 更新磁盘图表
  if (diskChartInstance) {
    diskChartInstance.data.labels = labels;
    diskChartInstance.data.datasets[0].data = diskData;
    diskChartInstance.update();
  } else if (diskChart.value) {
    diskChartInstance = new Chart(diskChart.value, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: '磁盘使用率 (%)',
          data: diskData,
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 2,
          pointRadius: 3,
          tension: 0.3,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            max: 100
          }
        }
      }
    });
  }
  
  // 更新网络图表
  if (networkChartInstance) {
    networkChartInstance.data.labels = labels;
    networkChartInstance.data.datasets[0].data = networkInData;
    networkChartInstance.data.datasets[1].data = networkOutData;
    networkChartInstance.update();
  } else if (networkChart.value) {
    networkChartInstance = new Chart(networkChart.value, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: '网络入流量 (KB/s)',
            data: networkInData,
            backgroundColor: 'rgba(153, 102, 255, 0.2)',
            borderColor: 'rgba(153, 102, 255, 1)',
            borderWidth: 2,
            pointRadius: 3,
            tension: 0.3,
          },
          {
            label: '网络出流量 (KB/s)',
            data: networkOutData,
            backgroundColor: 'rgba(255, 159, 64, 0.2)',
            borderColor: 'rgba(255, 159, 64, 1)',
            borderWidth: 2,
            pointRadius: 3,
            tension: 0.3,
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
      }
    });
  }
};

// 格式化日期
const formatDate = (dateStr: string | Date) => {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date);
};

// 格式化时间（只显示时间部分）
const formatTime = (dateStr: string | Date) => {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date);
};

// 格式化字节
const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

// 计算内存使用百分比
const getMemoryUsagePercentage = (metric: any) => {
  return (metric.memoryUsed / metric.memoryTotal) * 100;
};

// 计算磁盘使用百分比
const getDiskUsagePercentage = (metric: any) => {
  return (metric.diskUsed / metric.diskTotal) * 100;
};

// 自动刷新
const startAutoRefresh = (intervalMs = 60000) => { // 默认每分钟刷新一次
  stopAutoRefresh(); // 确保先停止之前的刷新
  refreshInterval.value = window.setInterval(fetchMetrics, intervalMs);
};

// 停止自动刷新
const stopAutoRefresh = () => {
  if (refreshInterval.value !== null) {
    clearInterval(refreshInterval.value);
    refreshInterval.value = null;
  }
};

// 组件加载时获取数据
onMounted(() => {
  fetchMetrics();
  startAutoRefresh();
});

// 组件卸载时清理资源
onUnmounted(() => {
  stopAutoRefresh();
  
  // 销毁图表实例
  if (cpuChartInstance) {
    cpuChartInstance.destroy();
    cpuChartInstance = null;
  }
  
  if (memoryChartInstance) {
    memoryChartInstance.destroy();
    memoryChartInstance = null;
  }
  
  if (diskChartInstance) {
    diskChartInstance.destroy();
    diskChartInstance = null;
  }
  
  if (networkChartInstance) {
    networkChartInstance.destroy();
    networkChartInstance = null;
  }
});
</script>

<template>
  <div class="p-4">
    <div class="flex justify-between items-center mb-4">
      <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">系统指标监控</h1>
      <div class="flex space-x-2">
        <button 
          @click="fetchMetrics" 
          class="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg flex items-center">
          <svg v-if="loading" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          刷新
        </button>
        <button 
          @click="analyzeMetrics" 
          class="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded-lg flex items-center"
          :disabled="loading">
          <svg v-if="analyzing" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          分析
        </button>
        <button 
          @click="generateMockData" 
          class="px-3 py-1.5 bg-gray-600 hover:bg-gray-500 text-white rounded-lg flex items-center"
          :disabled="generating">
          <svg v-if="generating" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v-4m0 8 4 4m-8 0-4-4m8-12V3" />
          </svg>
          生成模拟数据
        </button>
      </div>
    </div>

    <!-- 分析结果 -->
    <div v-if="analysis" class="mb-4">
      <div class="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
        <h2 class="text-lg font-medium text-gray-800 dark:text-white mb-2">指标分析结果</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div class="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <div class="text-sm text-gray-500 dark:text-gray-400">平均CPU使用率</div>
            <div :class="[
              'text-xl font-bold', 
              parseFloat(analysis.metrics.averageCpuUsage) > 80 ? 'text-red-500' : 
              parseFloat(analysis.metrics.averageCpuUsage) > 60 ? 'text-yellow-500' : 'text-green-500'
            ]">
              {{ analysis.metrics.averageCpuUsage }}%
            </div>
          </div>
          <div class="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <div class="text-sm text-gray-500 dark:text-gray-400">平均内存使用率</div>
            <div :class="[
              'text-xl font-bold', 
              parseFloat(analysis.metrics.averageMemoryUsage) > 85 ? 'text-red-500' : 
              parseFloat(analysis.metrics.averageMemoryUsage) > 70 ? 'text-yellow-500' : 'text-green-500'
            ]">
              {{ analysis.metrics.averageMemoryUsage }}%
            </div>
          </div>
          <div class="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <div class="text-sm text-gray-500 dark:text-gray-400">平均磁盘使用率</div>
            <div :class="[
              'text-xl font-bold', 
              parseFloat(analysis.metrics.averageDiskUsage) > 90 ? 'text-red-500' : 
              parseFloat(analysis.metrics.averageDiskUsage) > 75 ? 'text-yellow-500' : 'text-green-500'
            ]">
              {{ analysis.metrics.averageDiskUsage }}%
            </div>
          </div>
        </div>

        <!-- 异常和建议 -->
        <div v-if="analysis.hasAnomalies" class="bg-red-100 dark:bg-red-900/20 p-3 rounded-lg mb-3">
          <h3 class="text-md font-medium text-red-800 dark:text-red-300 mb-2">检测到异常</h3>
          <ul class="ml-4 list-disc text-red-700 dark:text-red-400">
            <li v-for="(anomaly, index) in analysis.anomalies" :key="index">{{ anomaly }}</li>
          </ul>
        </div>

        <div v-if="analysis.recommendedActions && analysis.recommendedActions.length > 0" class="bg-blue-100 dark:bg-blue-900/20 p-3 rounded-lg">
          <h3 class="text-md font-medium text-blue-800 dark:text-blue-300 mb-2">建议操作</h3>
          <ul class="ml-4 list-disc text-blue-700 dark:text-blue-400">
            <li v-for="(action, index) in analysis.recommendedActions" :key="index">{{ action }}</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- 指标图表 -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
      <!-- CPU 使用率 -->
      <div class="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
        <h2 class="text-lg font-medium text-gray-800 dark:text-white mb-2">CPU 使用率</h2>
        <div class="h-64">
          <canvas ref="cpuChart"></canvas>
        </div>
      </div>

      <!-- 内存使用率 -->
      <div class="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
        <h2 class="text-lg font-medium text-gray-800 dark:text-white mb-2">内存使用率</h2>
        <div class="h-64">
          <canvas ref="memoryChart"></canvas>
        </div>
      </div>

      <!-- 磁盘使用率 -->
      <div class="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
        <h2 class="text-lg font-medium text-gray-800 dark:text-white mb-2">磁盘使用率</h2>
        <div class="h-64">
          <canvas ref="diskChart"></canvas>
        </div>
      </div>

      <!-- 网络流量 -->
      <div class="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
        <h2 class="text-lg font-medium text-gray-800 dark:text-white mb-2">网络流量</h2>
        <div class="h-64">
          <canvas ref="networkChart"></canvas>
        </div>
      </div>
    </div>

    <!-- 原始指标数据表格 -->
    <div class="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
      <h2 class="text-lg font-medium text-gray-800 dark:text-white mb-4">原始指标数据</h2>
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead>
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">时间</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">CPU使用率</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">CPU温度</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">内存使用率</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">内存总量</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">磁盘使用率</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">磁盘总量</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">网络入流量</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">网络出流量</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            <tr v-for="(metric, index) in metrics" :key="index" class="hover:bg-gray-50 dark:hover:bg-gray-700">
              <td class="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">{{ formatDate(metric.createdAt) }}</td>
              <td :class="[
                'px-4 py-2 text-sm',
                metric.cpuUsage > 80 ? 'text-red-500 dark:text-red-400 font-medium' : 
                metric.cpuUsage > 60 ? 'text-yellow-500 dark:text-yellow-400' : 'text-gray-700 dark:text-gray-300'
              ]">{{ metric.cpuUsage.toFixed(1) }}%</td>
              <td class="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">{{ metric.cpuTemperature.toFixed(1) }}°C</td>
              <td :class="[
                'px-4 py-2 text-sm',
                getMemoryUsagePercentage(metric) > 85 ? 'text-red-500 dark:text-red-400 font-medium' :
                getMemoryUsagePercentage(metric) > 70 ? 'text-yellow-500 dark:text-yellow-400' : 'text-gray-700 dark:text-gray-300'
              ]">{{ getMemoryUsagePercentage(metric).toFixed(1) }}%</td>
              <td class="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">{{ formatBytes(metric.memoryTotal) }}</td>
              <td :class="[
                'px-4 py-2 text-sm',
                getDiskUsagePercentage(metric) > 90 ? 'text-red-500 dark:text-red-400 font-medium' :
                getDiskUsagePercentage(metric) > 75 ? 'text-yellow-500 dark:text-yellow-400' : 'text-gray-700 dark:text-gray-300'
              ]">{{ getDiskUsagePercentage(metric).toFixed(1) }}%</td>
              <td class="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">{{ formatBytes(metric.diskTotal) }}</td>
              <td class="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">{{ formatBytes(metric.networkBytesIn) }}/s</td>
              <td class="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">{{ formatBytes(metric.networkBytesOut) }}/s</td>
            </tr>
            <tr v-if="metrics.length === 0">
              <td colspan="9" class="px-4 py-4 text-sm text-center text-gray-500 dark:text-gray-400">暂无数据</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template> 