<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import Chart from 'chart.js/auto';
import { API_BASE_URL } from '../config';
import MetricsCard from '../components/MetricsCard.vue';
import LogsCard from '../components/LogsCard.vue';
import DeploymentCard from '../components/DeploymentCard.vue';
import StatusCard from '../components/StatusCard.vue';

// 状态变量
const loading = ref(false);
const loadingAlerts = ref(false);
const loadingTasks = ref(false);
const latestMetrics = ref<any>(null);
const metrics = ref<any[]>([]);
const alerts = ref<any[]>([]);
const tasks = ref<any[]>([]);
const refreshInterval = ref<number | null>(null);
const systemHistoryChart = ref<HTMLCanvasElement | null>(null);
let chartInstance: Chart | null = null;
const cpuTrend = ref(0);

// 旧代码的状态变量
const logs = ref<any[]>([]);
const deployments = ref<any[]>([]);
const oldLoading = ref({
  metrics: true,
  logs: true,
  deployments: true,
});

// 计算属性
const memoryUsagePercent = computed(() => {
  if (!latestMetrics.value) return 0;
  return (latestMetrics.value.memoryUsed / latestMetrics.value.memoryTotal) * 100;
});

const diskUsagePercent = computed(() => {
  if (!latestMetrics.value) return 0;
  return (latestMetrics.value.diskUsed / latestMetrics.value.diskTotal) * 100;
});

// 获取最新指标数据
const fetchLatestMetrics = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/metrics/system?limit=1`);
    const data = await response.json();
    
    if (data.success && data.metrics.length > 0) {
      latestMetrics.value = data.metrics[0];
    }
  } catch (error) {
    console.error('获取最新指标数据错误:', error);
  }
};

// 获取系统指标历史数据
const fetchMetricsHistory = async () => {
  loading.value = true;
  try {
    const response = await fetch(`${API_BASE_URL}/metrics/system?limit=20`);
    const data = await response.json();
    
    if (data.success) {
      metrics.value = data.metrics;
      
      // 计算CPU趋势 (与上一个值相比)
      if (metrics.value.length >= 2) {
        const current = metrics.value[0].cpuUsage;
        const previous = metrics.value[1].cpuUsage;
        cpuTrend.value = current - previous;
      }
      
      updateChart();
    }
  } catch (error) {
    console.error('获取指标历史数据错误:', error);
  } finally {
    loading.value = false;
  }
};

// 获取告警数据
const fetchAlerts = async () => {
  loadingAlerts.value = true;
  try {
    const response = await fetch(`${API_BASE_URL}/alerts`);
    const data = await response.json();
    
    if (data.success) {
      alerts.value = data.alerts;
    }
  } catch (error) {
    console.error('获取告警数据错误:', error);
  } finally {
    loadingAlerts.value = false;
  }
};

// 获取计划任务
const fetchTasks = async () => {
  loadingTasks.value = true;
  try {
    const response = await fetch(`${API_BASE_URL}/schedules`);
    const data = await response.json();
    
    if (data.success) {
      tasks.value = data.tasks;
    }
  } catch (error) {
    console.error('获取计划任务错误:', error);
  } finally {
    loadingTasks.value = false;
  }
};

// 旧的API函数
const fetchMetrics = async () => {
  try {
    oldLoading.value.metrics = true;
    const response = await fetch(`${import.meta.env.VITE_API_URL}/metrics/latest`);
    const data = await response.json();
    // 处理响应数据
  } catch (error) {
    console.error('Error fetching metrics:', error);
  } finally {
    oldLoading.value.metrics = false;
  }
};

const fetchLogs = async () => {
  try {
    oldLoading.value.logs = true;
    const response = await fetch(`${import.meta.env.VITE_API_URL}/logs?limit=5`);
    const data = await response.json();
    
    // Ensure logs is always an array
    if (Array.isArray(data)) {
      logs.value = data;
    } else if (data.rows && Array.isArray(data.rows)) {
      logs.value = data.rows;
    } else {
      // If response is not in expected format, use mock data
      generateMockLogs();
    }
  } catch (error) {
    console.error('Error fetching logs:', error);
    // Generate mock data when there's an error
    generateMockLogs();
  } finally {
    oldLoading.value.logs = false;
  }
};

const generateMockLogs = () => {
  // Only generate mock data in development
  if (import.meta.env.DEV) {
    logs.value = [
      { level: 'error', message: 'Database connection failed', service: 'api', timestamp: new Date().toISOString() },
      { level: 'warn', message: 'High CPU usage detected', service: 'monitoring', timestamp: new Date().toISOString() },
      { level: 'info', message: 'Application started successfully', service: 'api', timestamp: new Date().toISOString() },
      { level: 'debug', message: 'Processing request #1234', service: 'api', timestamp: new Date().toISOString() },
      { level: 'info', message: 'User login successful', service: 'auth', timestamp: new Date().toISOString() },
    ];
  } else {
    logs.value = [];
  }
};

const fetchDeployments = async () => {
  try {
    oldLoading.value.deployments = true;
    const response = await fetch(`${import.meta.env.VITE_API_URL}/deploy?limit=5`);
    const data = await response.json();
    
    // Ensure deployments is always an array
    if (Array.isArray(data)) {
      deployments.value = data;
    } else if (data.rows && Array.isArray(data.rows)) {
      deployments.value = data.rows;
    } else {
      // If response is not in expected format, use mock data
      generateMockDeployments();
    }
  } catch (error) {
    console.error('Error fetching deployments:', error);
    // Generate mock data when there's an error
    generateMockDeployments();
  } finally {
    oldLoading.value.deployments = false;
  }
};

const generateMockDeployments = () => {
  // Only generate mock data in development
  if (import.meta.env.DEV) {
    deployments.value = [
      { id: 1, name: 'api-service', version: 'v1.2.3', status: 'success', created_at: new Date().toISOString() },
      { id: 2, name: 'ui', version: 'v2.0.1', status: 'pending', created_at: new Date().toISOString() },
      { id: 3, name: 'database', version: 'v1.0.5', status: 'success', created_at: new Date().toISOString() },
    ];
  } else {
    deployments.value = [];
  }
};

// 更新图表
const updateChart = () => {
  if (!systemHistoryChart.value || metrics.value.length === 0) return;
  
  const ctx = systemHistoryChart.value.getContext('2d');
  if (!ctx) return;
  
  // 准备数据
  const labels = metrics.value.map(m => formatTime(m.createdAt)).reverse();
  const cpuData = metrics.value.map(m => m.cpuUsage).reverse();
  const memoryData = metrics.value.map(m => (m.memoryUsed / m.memoryTotal) * 100).reverse();
  const diskData = metrics.value.map(m => (m.diskUsed / m.diskTotal) * 100).reverse();
  
  // 如果图表已存在，更新数据
  if (chartInstance) {
    chartInstance.data.labels = labels;
    chartInstance.data.datasets[0].data = cpuData;
    chartInstance.data.datasets[1].data = memoryData;
    chartInstance.data.datasets[2].data = diskData;
    chartInstance.update();
    return;
  }
  
  // 否则创建新图表
  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'CPU使用率 (%)',
          data: cpuData,
          borderColor: 'rgba(59, 130, 246, 1)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
        },
        {
          label: '内存使用率 (%)',
          data: memoryData,
          borderColor: 'rgba(239, 68, 68, 1)',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
        },
        {
          label: '磁盘使用率 (%)',
          data: diskData,
          borderColor: 'rgba(16, 185, 129, 1)',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
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
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: (context) => {
              const label = context.dataset.label || '';
              const value = context.parsed.y;
              return `${label}: ${value.toFixed(1)}%`;
            }
          }
        }
      }
    }
  });
};

// 刷新所有数据
const refreshAll = async () => {
  await Promise.all([
    fetchLatestMetrics(),
    fetchMetricsHistory(),
    fetchAlerts(),
    fetchTasks()
  ]);
};

// 开始自动刷新
const startAutoRefresh = () => {
  refreshInterval.value = window.setInterval(() => {
    refreshAll();
  }, 60000); // 每分钟刷新一次
};

// 获取状态标签
const getStatusLabel = (value: number, warning: number, critical: number) => {
  if (value >= critical) return '严重';
  if (value >= warning) return '警告';
  return '正常';
};

// 获取状态样式类
const getStatusClass = (value: number, warning: number, critical: number) => {
  if (value >= critical) {
    return 'px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-800';
  }
  if (value >= warning) {
    return 'px-2 py-0.5 text-xs rounded-full bg-yellow-100 text-yellow-800';
  }
  return 'px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-800';
};

// 获取使用率条样式类
const getUsageBarClass = (value: number) => {
  if (value >= 90) return 'bg-red-500';
  if (value >= 75) return 'bg-yellow-500';
  return 'bg-green-500';
};

// 获取CPU趋势样式类
const getCpuTrendClass = () => {
  if (cpuTrend.value > 5) return 'text-red-500';
  if (cpuTrend.value > 0) return 'text-yellow-500';
  if (cpuTrend.value < -5) return 'text-green-500';
  if (cpuTrend.value < 0) return 'text-blue-500';
  return 'text-gray-500';
};

// 获取告警背景样式类
const getAlertBgClass = (severity: string) => {
  switch (severity) {
    case 'critical':
      return 'bg-red-50 dark:bg-red-900/20';
    case 'warning':
      return 'bg-yellow-50 dark:bg-yellow-900/20';
    default:
      return 'bg-blue-50 dark:bg-blue-900/20';
  }
};

// 获取告警图标样式类
const getAlertIconClass = (severity: string) => {
  switch (severity) {
    case 'critical':
      return 'text-red-500';
    case 'warning':
      return 'text-yellow-500';
    default:
      return 'text-blue-500';
  }
};

// 格式化字节
const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
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

// 初始化 - 合并两个版本的初始化逻辑
onMounted(async () => {
  // 新的初始化
  await refreshAll();
  startAutoRefresh();
  
  // 旧的初始化
  fetchMetrics();
  fetchLogs();
  fetchDeployments();
});

// 清理
onUnmounted(() => {
  if (refreshInterval.value !== null) {
    clearInterval(refreshInterval.value);
  }
  if (chartInstance) {
    chartInstance.destroy();
  }
});

// 监听暗黑模式变化，更新图表
watch(() => document.documentElement.classList.contains('dark'), () => {
  updateChart();
});
</script>

<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <h1 class="text-2xl font-bold">系统仪表板</h1>
      <div class="flex gap-2">
        <button 
          @click="refreshAll" 
          class="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center gap-1"
          :disabled="loading">
          <span v-if="loading" class="animate-spin">⟳</span>
          <span>刷新</span>
        </button>
      </div>
    </div>

    <!-- 系统状态概览 -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <div class="flex justify-between">
          <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">CPU 使用率</h3>
          <div :class="getStatusClass(latestMetrics?.cpuUsage || 0, 80, 90)">
            {{ getStatusLabel(latestMetrics?.cpuUsage || 0, 80, 90) }}
          </div>
        </div>
        <div class="mt-2 flex items-end">
          <span class="text-2xl font-bold">{{ latestMetrics?.cpuUsage?.toFixed(1) || '0.0' }}%</span>
          <div class="ml-2 text-xs" :class="getCpuTrendClass()">
            <span v-if="cpuTrend > 0">↑ {{ cpuTrend.toFixed(1) }}%</span>
            <span v-else-if="cpuTrend < 0">↓ {{ Math.abs(cpuTrend).toFixed(1) }}%</span>
            <span v-else>-</span>
          </div>
        </div>
        <div class="mt-2 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div class="h-full rounded-full" 
               :class="getUsageBarClass(latestMetrics?.cpuUsage || 0)"
               :style="{ width: `${Math.min(latestMetrics?.cpuUsage || 0, 100)}%` }"></div>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <div class="flex justify-between">
          <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">内存使用率</h3>
          <div :class="getStatusClass(memoryUsagePercent, 75, 90)">
            {{ getStatusLabel(memoryUsagePercent, 75, 90) }}
          </div>
        </div>
        <div class="mt-2 flex items-end">
          <span class="text-2xl font-bold">{{ memoryUsagePercent.toFixed(1) }}%</span>
          <span class="ml-2 text-xs text-gray-500">{{ formatBytes(latestMetrics?.memoryUsed || 0) }} / {{ formatBytes(latestMetrics?.memoryTotal || 0) }}</span>
        </div>
        <div class="mt-2 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div class="h-full rounded-full" 
               :class="getUsageBarClass(memoryUsagePercent)"
               :style="{ width: `${memoryUsagePercent}%` }"></div>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <div class="flex justify-between">
          <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">磁盘使用率</h3>
          <div :class="getStatusClass(diskUsagePercent, 85, 95)">
            {{ getStatusLabel(diskUsagePercent, 85, 95) }}
          </div>
        </div>
        <div class="mt-2 flex items-end">
          <span class="text-2xl font-bold">{{ diskUsagePercent.toFixed(1) }}%</span>
          <span class="ml-2 text-xs text-gray-500">{{ formatBytes(latestMetrics?.diskUsed || 0) }} / {{ formatBytes(latestMetrics?.diskTotal || 0) }}</span>
        </div>
        <div class="mt-2 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div class="h-full rounded-full" 
               :class="getUsageBarClass(diskUsagePercent)"
               :style="{ width: `${diskUsagePercent}%` }"></div>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <div class="flex justify-between">
          <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">网络流量 (KB/s)</h3>
          <div class="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800">实时</div>
        </div>
        <div class="mt-2 flex items-end justify-between">
          <div>
            <div class="flex items-center text-sm">
              <span class="w-3 h-3 rounded-full bg-green-500 mr-1"></span>
              <span>入站: {{ (latestMetrics?.networkBytesIn || 0) / 1024 | 0 }}</span>
            </div>
            <div class="flex items-center text-sm mt-1">
              <span class="w-3 h-3 rounded-full bg-blue-500 mr-1"></span>
              <span>出站: {{ (latestMetrics?.networkBytesOut || 0) / 1024 | 0 }}</span>
            </div>
          </div>
          <div class="text-xl font-bold">
            {{ ((latestMetrics?.networkBytesIn || 0) + (latestMetrics?.networkBytesOut || 0)) / 1024 | 0 }}
          </div>
        </div>
      </div>
    </div>

    <!-- 告警和系统状态 -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <!-- 最新告警 -->
      <div class="md:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow">
        <div class="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 class="text-lg font-semibold">最新告警</h2>
          <router-link to="/alerts" class="text-blue-500 hover:text-blue-600 text-sm">查看全部 →</router-link>
        </div>
        <div class="p-4">
          <div v-if="loadingAlerts" class="flex justify-center items-center h-32">
            <div class="animate-spin h-6 w-6 border-2 border-blue-500 rounded-full border-t-transparent"></div>
          </div>
          <div v-else-if="alerts.length === 0" class="text-center py-8 text-gray-500">
            目前没有告警信息
          </div>
          <div v-else class="space-y-3">
            <div v-for="alert in alerts.slice(0, 3)" :key="alert.id" 
                 class="p-3 rounded-md" :class="getAlertBgClass(alert.severity)">
              <div class="flex justify-between">
                <div class="font-medium flex items-center">
                  <span :class="getAlertIconClass(alert.severity)" class="mr-2">⚠</span>
                  <span>{{ alert.source }} - {{ alert.metric }}</span>
                </div>
                <div class="text-xs text-gray-500">{{ formatTime(alert.timestamp) }}</div>
              </div>
              <div class="mt-1 text-sm">{{ alert.message }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 任务状态 -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div class="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 class="text-lg font-semibold">计划任务状态</h2>
          <router-link to="/schedules" class="text-blue-500 hover:text-blue-600 text-sm">管理 →</router-link>
        </div>
        <div class="p-4">
          <div v-if="loadingTasks" class="flex justify-center items-center h-32">
            <div class="animate-spin h-6 w-6 border-2 border-blue-500 rounded-full border-t-transparent"></div>
          </div>
          <div v-else-if="tasks.length === 0" class="text-center py-8 text-gray-500">
            没有计划任务
          </div>
          <div v-else class="space-y-3">
            <div v-for="task in tasks" :key="task.id" class="border-b border-gray-200 dark:border-gray-700 last:border-b-0 pb-3 last:pb-0">
              <div class="flex justify-between items-center">
                <span class="font-medium">{{ task.name }}</span>
                <span :class="task.isEnabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'" class="px-2 py-0.5 text-xs rounded-full">
                  {{ task.isEnabled ? '已启用' : '已禁用' }}
                </span>
              </div>
              <div class="text-xs text-gray-500 mt-1">
                <div>Cron: {{ task.cronExpression }}</div>
                <div>下次执行: {{ formatTime(task.nextRunTime) }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 系统资源使用历史 -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow">
      <div class="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 class="text-lg font-semibold">系统资源使用历史</h2>
      </div>
      <div class="p-4">
        <div class="h-80">
          <canvas ref="systemHistoryChart"></canvas>
        </div>
      </div>
    </div>
  </div>
</template> 