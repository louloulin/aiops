<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <h1 class="text-2xl font-bold">系统指标分析</h1>
      <div class="flex gap-2">
        <button 
          @click="refreshData" 
          class="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center gap-1"
          :disabled="loading">
          <span v-if="loading" class="animate-spin">⟳</span>
          <span>刷新数据</span>
        </button>
      </div>
    </div>

    <!-- 时间范围选择器 -->
    <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
      <div class="flex flex-wrap gap-4 items-center">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">时间范围</label>
          <select 
            v-model="timeRange" 
            class="w-40 rounded border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white shadow-sm">
            <option value="1h">最近1小时</option>
            <option value="6h">最近6小时</option>
            <option value="12h">最近12小时</option>
            <option value="24h">最近24小时</option>
            <option value="7d">最近7天</option>
            <option value="30d">最近30天</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">数据粒度</label>
          <select 
            v-model="granularity" 
            class="w-40 rounded border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white shadow-sm">
            <option value="1m">1分钟</option>
            <option value="5m">5分钟</option>
            <option value="15m">15分钟</option>
            <option value="1h">1小时</option>
            <option value="6h">6小时</option>
          </select>
        </div>
        <div class="ml-auto">
          <button 
            @click="analyzeMetrics" 
            class="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            :disabled="loading">
            分析当前数据
          </button>
        </div>
      </div>
    </div>

    <!-- 系统资源使用图表 -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- CPU使用率图表 -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div class="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 class="text-lg font-semibold">CPU使用率</h2>
          <div class="flex items-center">
            <span class="font-medium text-lg mr-2">{{ averages.cpu.toFixed(1) }}%</span>
            <span 
              :class="getTrendClass(cpuTrend)" 
              class="inline-flex items-center text-xs px-2 py-0.5 rounded-full">
              <template v-if="cpuTrend > 0">↑ {{ cpuTrend.toFixed(1) }}%</template>
              <template v-else-if="cpuTrend < 0">↓ {{ Math.abs(cpuTrend).toFixed(1) }}%</template>
              <template v-else>- 稳定</template>
            </span>
          </div>
        </div>
        <div class="p-4">
          <div class="h-64">
            <canvas ref="cpuChart"></canvas>
          </div>
        </div>
      </div>

      <!-- 内存使用率图表 -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div class="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 class="text-lg font-semibold">内存使用率</h2>
          <div class="flex items-center">
            <span class="font-medium text-lg mr-2">{{ averages.memory.toFixed(1) }}%</span>
            <span 
              :class="getTrendClass(memoryTrend)" 
              class="inline-flex items-center text-xs px-2 py-0.5 rounded-full">
              <template v-if="memoryTrend > 0">↑ {{ memoryTrend.toFixed(1) }}%</template>
              <template v-else-if="memoryTrend < 0">↓ {{ Math.abs(memoryTrend).toFixed(1) }}%</template>
              <template v-else>- 稳定</template>
            </span>
          </div>
        </div>
        <div class="p-4">
          <div class="h-64">
            <canvas ref="memoryChart"></canvas>
          </div>
        </div>
      </div>

      <!-- 磁盘使用率图表 -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div class="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 class="text-lg font-semibold">磁盘使用率</h2>
          <div class="flex items-center">
            <span class="font-medium text-lg mr-2">{{ averages.disk.toFixed(1) }}%</span>
            <span 
              :class="getTrendClass(diskTrend)" 
              class="inline-flex items-center text-xs px-2 py-0.5 rounded-full">
              <template v-if="diskTrend > 0">↑ {{ diskTrend.toFixed(1) }}%</template>
              <template v-else-if="diskTrend < 0">↓ {{ Math.abs(diskTrend).toFixed(1) }}%</template>
              <template v-else>- 稳定</template>
            </span>
          </div>
        </div>
        <div class="p-4">
          <div class="h-64">
            <canvas ref="diskChart"></canvas>
          </div>
        </div>
      </div>

      <!-- 网络流量图表 -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div class="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 class="text-lg font-semibold">网络流量 (KB/s)</h2>
          <div class="flex items-center">
            <span class="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">平均值</span>
            <span class="ml-2 font-medium text-lg">{{ averages.network.toFixed(1) }}</span>
          </div>
        </div>
        <div class="p-4">
          <div class="h-64">
            <canvas ref="networkChart"></canvas>
          </div>
        </div>
      </div>
    </div>

    <!-- 系统指标分析结果 -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow">
      <div class="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 class="text-lg font-semibold">系统指标分析结果</h2>
      </div>
      <div class="p-4">
        <div v-if="loadingAnalysis" class="flex justify-center items-center py-12">
          <div class="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
        </div>
        <div v-else-if="!analysis.anomalies || analysis.anomalies.length === 0" class="text-center py-8 text-gray-500">
          <div class="mb-4">
            <span class="inline-block p-3 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            </span>
          </div>
          <p class="text-lg font-medium">系统运行正常</p>
          <p class="mt-2">分析未发现任何异常情况</p>
        </div>
        <div v-else>
          <div class="mb-4">
            <h3 class="text-md font-medium mb-2">检测到的异常 ({{ analysis.anomalies.length }})</h3>
            <div class="space-y-3">
              <div 
                v-for="(anomaly, index) in analysis.anomalies" 
                :key="index"
                class="p-3 rounded-md border" 
                :class="getAnomalyBorderClass(anomaly.metric)">
                <div class="flex items-center">
                  <span class="mr-2" :class="getAnomalyIconClass(anomaly.metric)">⚠</span>
                  <span class="font-medium">{{ getMetricName(anomaly.metric) }}</span>
                </div>
                <div class="mt-1 text-sm">{{ anomaly.message }}</div>
              </div>
            </div>
          </div>
          <div>
            <h3 class="text-md font-medium mb-2">推荐操作</h3>
            <ul class="list-disc pl-5 space-y-1">
              <li v-for="(action, index) in analysis.actions" :key="index" class="text-sm">
                {{ action }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import Chart from 'chart.js/auto';
import { API_BASE_URL } from '../config';

// 状态
const loading = ref(false);
const loadingAnalysis = ref(false);
const timeRange = ref('24h');
const granularity = ref('5m');
const metrics = ref<any[]>([]);
const analysis = ref<any>({});

// 图表引用
const cpuChart = ref<HTMLCanvasElement | null>(null);
const memoryChart = ref<HTMLCanvasElement | null>(null);
const diskChart = ref<HTMLCanvasElement | null>(null);
const networkChart = ref<HTMLCanvasElement | null>(null);

// 图表实例
let cpuChartInstance: Chart | null = null;
let memoryChartInstance: Chart | null = null;
let diskChartInstance: Chart | null = null;
let networkChartInstance: Chart | null = null;

// 趋势和平均值
const cpuTrend = ref(0);
const memoryTrend = ref(0);
const diskTrend = ref(0);
const averages = ref({
  cpu: 0,
  memory: 0,
  disk: 0,
  network: 0
});

// 获取指标数据
const fetchMetricsData = async () => {
  loading.value = true;
  try {
    const response = await fetch(`${API_BASE_URL}/metrics/system?timeRange=${timeRange.value}&limit=100`);
    const data = await response.json();
    
    if (data.success) {
      metrics.value = data.metrics;
      
      // 计算平均值
      if (metrics.value.length > 0) {
        let cpuSum = 0, memorySum = 0, diskSum = 0, networkSum = 0;
        
        metrics.value.forEach(metric => {
          cpuSum += metric.cpuUsage;
          memorySum += (metric.memoryUsed / metric.memoryTotal) * 100;
          diskSum += (metric.diskUsed / metric.diskTotal) * 100;
          networkSum += ((metric.networkBytesIn + metric.networkBytesOut) / 1024);
        });
        
        const count = metrics.value.length;
        averages.value = {
          cpu: cpuSum / count,
          memory: memorySum / count,
          disk: diskSum / count,
          network: networkSum / count
        };
      }
      
      // 计算趋势（当前值与平均值的差异）
      if (metrics.value.length >= 2) {
        const current = metrics.value[0];
        const currentCpu = current.cpuUsage;
        const currentMemory = (current.memoryUsed / current.memoryTotal) * 100;
        const currentDisk = (current.diskUsed / current.diskTotal) * 100;
        
        cpuTrend.value = currentCpu - averages.value.cpu;
        memoryTrend.value = currentMemory - averages.value.memory;
        diskTrend.value = currentDisk - averages.value.disk;
      }
      
      updateCharts();
    }
  } catch (error) {
    console.error('获取指标数据错误:', error);
  } finally {
    loading.value = false;
  }
};

// 分析指标数据
const analyzeMetrics = async () => {
  loadingAnalysis.value = true;
  try {
    const response = await fetch(`${API_BASE_URL}/metrics/system/analyze?timeRange=${timeRange.value}`);
    const data = await response.json();
    
    if (data.success) {
      analysis.value = data;
    }
  } catch (error) {
    console.error('分析指标数据错误:', error);
  } finally {
    loadingAnalysis.value = false;
  }
};

// 更新图表
const updateCharts = () => {
  if (metrics.value.length === 0) return;
  
  // 准备数据
  const timestamps = metrics.value.map(m => formatTime(m.createdAt)).reverse();
  const cpuData = metrics.value.map(m => m.cpuUsage).reverse();
  const memoryData = metrics.value.map(m => (m.memoryUsed / m.memoryTotal) * 100).reverse();
  const diskData = metrics.value.map(m => (m.diskUsed / m.diskTotal) * 100).reverse();
  const networkInData = metrics.value.map(m => m.networkBytesIn / 1024).reverse();
  const networkOutData = metrics.value.map(m => m.networkBytesOut / 1024).reverse();
  
  updateCpuChart(timestamps, cpuData);
  updateMemoryChart(timestamps, memoryData);
  updateDiskChart(timestamps, diskData);
  updateNetworkChart(timestamps, networkInData, networkOutData);
};

// 更新CPU图表
const updateCpuChart = (timestamps: string[], data: number[]) => {
  if (!cpuChart.value) return;
  
  const ctx = cpuChart.value.getContext('2d');
  if (!ctx) return;

  if (cpuChartInstance) {
    cpuChartInstance.data.labels = timestamps;
    cpuChartInstance.data.datasets[0].data = data;
    cpuChartInstance.update();
    return;
  }
  
  cpuChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: timestamps,
      datasets: [{
        label: 'CPU使用率 (%)',
        data: data,
        borderColor: 'rgba(59, 130, 246, 1)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
      }]
    },
    options: getChartOptions('CPU使用率 (%)')
  });
};

// 更新内存图表
const updateMemoryChart = (timestamps: string[], data: number[]) => {
  if (!memoryChart.value) return;
  
  const ctx = memoryChart.value.getContext('2d');
  if (!ctx) return;

  if (memoryChartInstance) {
    memoryChartInstance.data.labels = timestamps;
    memoryChartInstance.data.datasets[0].data = data;
    memoryChartInstance.update();
    return;
  }
  
  memoryChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: timestamps,
      datasets: [{
        label: '内存使用率 (%)',
        data: data,
        borderColor: 'rgba(239, 68, 68, 1)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
      }]
    },
    options: getChartOptions('内存使用率 (%)')
  });
};

// 更新磁盘图表
const updateDiskChart = (timestamps: string[], data: number[]) => {
  if (!diskChart.value) return;
  
  const ctx = diskChart.value.getContext('2d');
  if (!ctx) return;

  if (diskChartInstance) {
    diskChartInstance.data.labels = timestamps;
    diskChartInstance.data.datasets[0].data = data;
    diskChartInstance.update();
    return;
  }
  
  diskChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: timestamps,
      datasets: [{
        label: '磁盘使用率 (%)',
        data: data,
        borderColor: 'rgba(16, 185, 129, 1)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
      }]
    },
    options: getChartOptions('磁盘使用率 (%)')
  });
};

// 更新网络图表
const updateNetworkChart = (timestamps: string[], inData: number[], outData: number[]) => {
  if (!networkChart.value) return;
  
  const ctx = networkChart.value.getContext('2d');
  if (!ctx) return;

  if (networkChartInstance) {
    networkChartInstance.data.labels = timestamps;
    networkChartInstance.data.datasets[0].data = inData;
    networkChartInstance.data.datasets[1].data = outData;
    networkChartInstance.update();
    return;
  }
  
  networkChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: timestamps,
      datasets: [
        {
          label: '入站流量 (KB/s)',
          data: inData,
          borderColor: 'rgba(16, 185, 129, 1)',
          backgroundColor: 'rgba(16, 185, 129, 0.05)',
          borderWidth: 2,
          tension: 0.4,
        },
        {
          label: '出站流量 (KB/s)',
          data: outData,
          borderColor: 'rgba(59, 130, 246, 1)',
          backgroundColor: 'rgba(59, 130, 246, 0.05)',
          borderWidth: 2,
          tension: 0.4,
        }
      ]
    },
    options: {
      ...getChartOptions('网络流量 (KB/s)'),
      scales: {
        x: {
          grid: {
            display: false
          }
        },
        y: {
          ticks: {
            callback: (value) => `${value} KB/s`
          }
        }
      }
    }
  });
};

// 获取图表配置
const getChartOptions = (title: string) => {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: false,
        text: title
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        }
      },
      y: {
        min: 0,
        max: 100,
        ticks: {
          callback: (value) => `${value}%`
        }
      }
    },
    interaction: {
      mode: 'index',
      intersect: false,
    }
  };
};

// 刷新数据
const refreshData = async () => {
  await fetchMetricsData();
  await analyzeMetrics();
};

// 获取趋势样式类
const getTrendClass = (value: number) => {
  if (value > 20) return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
  if (value > 10) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
  if (value > 5) return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
  if (value < -10) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
  if (value < -5) return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
  return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
};

// 格式化时间
const formatTime = (dateStr: string | Date) => {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(date);
};

// 获取异常指标图标样式
const getAnomalyIconClass = (metric: string) => {
  switch(metric) {
    case 'cpuUsage':
      return 'text-red-500 dark:text-red-400';
    case 'memoryUsage':
      return 'text-yellow-500 dark:text-yellow-400';
    case 'diskUsage':
      return 'text-orange-500 dark:text-orange-400';
    case 'networkUsage':
      return 'text-blue-500 dark:text-blue-400';
    default:
      return 'text-gray-500 dark:text-gray-400';
  }
};

// 获取异常指标边框样式
const getAnomalyBorderClass = (metric: string) => {
  switch(metric) {
    case 'cpuUsage':
      return 'border-red-200 dark:border-red-900';
    case 'memoryUsage':
      return 'border-yellow-200 dark:border-yellow-900';
    case 'diskUsage':
      return 'border-orange-200 dark:border-orange-900';
    case 'networkUsage':
      return 'border-blue-200 dark:border-blue-900';
    default:
      return 'border-gray-200 dark:border-gray-800';
  }
};

// 获取指标名称
const getMetricName = (metric: string) => {
  switch(metric) {
    case 'cpuUsage':
      return 'CPU使用率';
    case 'memoryUsage':
      return '内存使用率';
    case 'diskUsage':
      return '磁盘使用率';
    case 'networkUsage':
      return '网络流量';
    default:
      return metric;
  }
};

// 监听时间范围和粒度变化，刷新数据
watch([timeRange, granularity], () => {
  fetchMetricsData();
});

// 初始化
onMounted(async () => {
  await refreshData();
});

// 清理
onUnmounted(() => {
  if (cpuChartInstance) cpuChartInstance.destroy();
  if (memoryChartInstance) memoryChartInstance.destroy();
  if (diskChartInstance) diskChartInstance.destroy();
  if (networkChartInstance) networkChartInstance.destroy();
});

// 监听暗黑模式变化，更新图表
watch(() => document.documentElement.classList.contains('dark'), () => {
  updateCharts();
});
</script> 