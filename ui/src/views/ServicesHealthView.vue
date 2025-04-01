<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <h1 class="text-2xl font-bold">服务健康监控</h1>
      <div class="flex gap-2">
        <button 
          @click="refreshStatus" 
          class="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center gap-1"
          :disabled="loading">
          <span v-if="loading" class="animate-spin">⟳</span>
          <span>刷新状态</span>
        </button>
      </div>
    </div>

    <!-- 系统状态概览 -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <div class="flex flex-col items-center">
          <div :class="getServiceIconClass(overallStatus)" class="h-12 w-12 rounded-full flex items-center justify-center mb-2">
            <svg v-if="overallStatus === 'healthy'" xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            <svg v-else-if="overallStatus === 'warning'" xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 class="text-lg font-medium text-center">整体系统状态</h3>
          <p :class="getStatusTextClass(overallStatus)" class="font-medium mt-1">
            {{ getStatusText(overallStatus) }}
          </p>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-2 text-center">
            上次更新于 {{ lastUpdated ? formatTime(lastUpdated) : '未知' }}
          </p>
        </div>
      </div>
      
      <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">正常服务</h3>
        <div class="flex items-center mt-2">
          <span class="text-3xl font-bold text-green-500">
            {{ healthySummary }}
          </span>
          <span class="ml-2 text-sm text-gray-500">/ {{ serviceStatuses.length }}</span>
        </div>
        <div class="mt-4">
          <div class="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
            <div class="absolute top-0 left-0 h-full bg-green-500 rounded-full" 
                 :style="{ width: `${(healthySummary / Math.max(serviceStatuses.length, 1)) * 100}%` }"></div>
          </div>
        </div>
      </div>
      
      <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">警告服务</h3>
        <div class="flex items-center mt-2">
          <span class="text-3xl font-bold text-yellow-500">
            {{ warningSummary }}
          </span>
          <span class="ml-2 text-sm text-gray-500">/ {{ serviceStatuses.length }}</span>
        </div>
        <div class="mt-4">
          <div class="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
            <div class="absolute top-0 left-0 h-full bg-yellow-500 rounded-full" 
                 :style="{ width: `${(warningSummary / Math.max(serviceStatuses.length, 1)) * 100}%` }"></div>
          </div>
        </div>
      </div>
      
      <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">错误服务</h3>
        <div class="flex items-center mt-2">
          <span class="text-3xl font-bold text-red-500">
            {{ errorSummary }}
          </span>
          <span class="ml-2 text-sm text-gray-500">/ {{ serviceStatuses.length }}</span>
        </div>
        <div class="mt-4">
          <div class="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
            <div class="absolute top-0 left-0 h-full bg-red-500 rounded-full" 
                 :style="{ width: `${(errorSummary / Math.max(serviceStatuses.length, 1)) * 100}%` }"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 服务状态列表 -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow">
      <div class="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <h2 class="text-lg font-semibold">服务状态</h2>
        <div class="flex gap-2">
          <select 
            v-model="statusFilter" 
            class="rounded border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white text-sm">
            <option value="all">所有状态</option>
            <option value="healthy">正常</option>
            <option value="warning">警告</option>
            <option value="error">错误</option>
          </select>
        </div>
      </div>
      
      <div class="p-4">
        <div v-if="loading" class="flex justify-center items-center h-64">
          <div class="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
        </div>
        
        <div v-else-if="filteredServices.length === 0" class="text-center py-12 text-gray-500">
          没有符合条件的服务
        </div>
        
        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div 
            v-for="service in filteredServices" 
            :key="service.id"
            class="border rounded-lg overflow-hidden"
            :class="getServiceBorderClass(service.status)">
            <div class="px-4 py-3 border-b" :class="getServiceHeaderClass(service.status)">
              <div class="flex justify-between items-center">
                <div class="flex items-center">
                  <div :class="getStatusIndicatorClass(service.status)" class="h-3 w-3 rounded-full mr-2"></div>
                  <h3 class="font-medium">{{ service.name }}</h3>
                </div>
                <div class="text-xs font-medium px-2 py-0.5 rounded-full" :class="getStatusBadgeClass(service.status)">
                  {{ getStatusText(service.status) }}
                </div>
              </div>
            </div>
            <div class="p-4">
              <div class="mb-2">
                <span class="text-sm text-gray-500 dark:text-gray-400">描述：</span>
                <span class="text-sm">{{ service.description }}</span>
              </div>
              <div class="mb-2">
                <span class="text-sm text-gray-500 dark:text-gray-400">版本：</span>
                <span class="text-sm">{{ service.version }}</span>
              </div>
              <div class="mb-2">
                <span class="text-sm text-gray-500 dark:text-gray-400">运行时间：</span>
                <span class="text-sm">{{ formatUptime(service.uptime) }}</span>
              </div>
              <div v-if="service.message" class="mt-3 text-sm">
                <span class="font-medium" :class="getStatusTextClass(service.status)">信息：</span>
                <span>{{ service.message }}</span>
              </div>
            </div>
            <div class="p-4 bg-gray-50 dark:bg-gray-900 border-t">
              <div class="flex justify-between">
                <span class="text-xs text-gray-500">上次检查: {{ formatTime(service.lastCheck) }}</span>
                <button 
                  @click="checkService(service.id)" 
                  class="text-xs text-blue-500 hover:text-blue-600"
                  :disabled="loading">
                  检查
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 服务事件日志 -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow">
      <div class="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 class="text-lg font-semibold">服务事件日志</h2>
      </div>
      <div class="p-4">
        <div v-if="loadingEvents" class="flex justify-center items-center h-24">
          <div class="animate-spin h-6 w-6 border-4 border-blue-500 rounded-full border-t-transparent"></div>
        </div>
        
        <div v-else-if="serviceEvents.length === 0" class="text-center py-8 text-gray-500">
          暂无事件记录
        </div>
        
        <div v-else class="overflow-hidden">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">时间</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">服务</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">类型</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">消息</th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              <tr v-for="event in serviceEvents" :key="event.id" :class="getEventRowClass(event.type)">
                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                  {{ formatTime(event.timestamp) }}
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-sm">
                  {{ event.serviceName }}
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-sm">
                  <span class="px-2 py-1 text-xs rounded-full" :class="getEventTypeBadgeClass(event.type)">
                    {{ getEventTypeText(event.type) }}
                  </span>
                </td>
                <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                  {{ event.message }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { API_BASE_URL } from '../config';

// 状态
const loading = ref(false);
const loadingEvents = ref(false);
const serviceStatuses = ref<any[]>([]);
const serviceEvents = ref<any[]>([]);
const lastUpdated = ref<Date | null>(null);
const statusFilter = ref('all');
const refreshInterval = ref<number | null>(null);

// 计算属性
const filteredServices = computed(() => {
  if (statusFilter.value === 'all') {
    return serviceStatuses.value;
  }
  return serviceStatuses.value.filter(service => service.status === statusFilter.value);
});

const healthySummary = computed(() => 
  serviceStatuses.value.filter(s => s.status === 'healthy').length
);

const warningSummary = computed(() => 
  serviceStatuses.value.filter(s => s.status === 'warning').length
);

const errorSummary = computed(() => 
  serviceStatuses.value.filter(s => s.status === 'error').length
);

const overallStatus = computed(() => {
  if (errorSummary.value > 0) return 'error';
  if (warningSummary.value > 0) return 'warning';
  return 'healthy';
});

// 获取服务状态
const fetchServiceStatus = async () => {
  loading.value = true;
  try {
    const response = await fetch(`${API_BASE_URL}/services/status`);
    const data = await response.json();
    
    if (data.success) {
      serviceStatuses.value = data.services;
      lastUpdated.value = new Date();
    } else {
      console.error('获取服务状态失败:', data.error);
    }
  } catch (error) {
    console.error('获取服务状态错误:', error);
  } finally {
    loading.value = false;
  }
};

// 获取服务事件
const fetchServiceEvents = async () => {
  loadingEvents.value = true;
  try {
    const response = await fetch(`${API_BASE_URL}/services/events?limit=10`);
    const data = await response.json();
    
    if (data.success) {
      serviceEvents.value = data.events;
    } else {
      console.error('获取服务事件失败:', data.error);
    }
  } catch (error) {
    console.error('获取服务事件错误:', error);
  } finally {
    loadingEvents.value = false;
  }
};

// 刷新状态
const refreshStatus = async () => {
  await Promise.all([
    fetchServiceStatus(),
    fetchServiceEvents()
  ]);
};

// 检查指定服务
const checkService = async (serviceId: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/services/${serviceId}/check`, {
      method: 'POST'
    });
    const data = await response.json();
    
    if (data.success) {
      // 更新服务状态
      const index = serviceStatuses.value.findIndex(s => s.id === serviceId);
      if (index !== -1) {
        serviceStatuses.value[index] = data.service;
      }
    } else {
      console.error('服务检查失败:', data.error);
    }
  } catch (error) {
    console.error('服务检查错误:', error);
  }
};

// 开始自动刷新
const startAutoRefresh = () => {
  refreshInterval.value = window.setInterval(() => {
    refreshStatus();
  }, 60000); // 每分钟刷新一次
};

// 格式化时间
const formatTime = (dateStr: string | Date) => {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).format(date);
};

// 格式化运行时间
const formatUptime = (seconds: number) => {
  if (seconds < 60) return `${seconds}秒`;
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}分钟`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}小时`;
  
  const days = Math.floor(hours / 24);
  return `${days}天 ${hours % 24}小时`;
};

// 获取状态文本
const getStatusText = (status: string) => {
  switch (status) {
    case 'healthy':
      return '正常';
    case 'warning':
      return '警告';
    case 'error':
      return '错误';
    default:
      return status;
  }
};

// 获取状态文本样式类
const getStatusTextClass = (status: string) => {
  switch (status) {
    case 'healthy':
      return 'text-green-500 dark:text-green-400';
    case 'warning':
      return 'text-yellow-500 dark:text-yellow-400';
    case 'error':
      return 'text-red-500 dark:text-red-400';
    default:
      return 'text-gray-500 dark:text-gray-400';
  }
};

// 获取状态指示器样式类
const getStatusIndicatorClass = (status: string) => {
  switch (status) {
    case 'healthy':
      return 'bg-green-500';
    case 'warning':
      return 'bg-yellow-500';
    case 'error':
      return 'bg-red-500';
    default:
      return 'bg-gray-500';
  }
};

// 获取状态标签样式类
const getStatusBadgeClass = (status: string) => {
  switch (status) {
    case 'healthy':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case 'warning':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    case 'error':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  }
};

// 获取服务图标样式类
const getServiceIconClass = (status: string) => {
  switch (status) {
    case 'healthy':
      return 'bg-green-100 text-green-500 dark:bg-green-900 dark:text-green-300';
    case 'warning':
      return 'bg-yellow-100 text-yellow-500 dark:bg-yellow-900 dark:text-yellow-300';
    case 'error':
      return 'bg-red-100 text-red-500 dark:bg-red-900 dark:text-red-300';
    default:
      return 'bg-gray-100 text-gray-500 dark:bg-gray-900 dark:text-gray-300';
  }
};

// 获取服务边框样式类
const getServiceBorderClass = (status: string) => {
  switch (status) {
    case 'healthy':
      return 'border-green-200 dark:border-green-900';
    case 'warning':
      return 'border-yellow-200 dark:border-yellow-900';
    case 'error':
      return 'border-red-200 dark:border-red-900';
    default:
      return 'border-gray-200 dark:border-gray-800';
  }
};

// 获取服务标题栏样式类
const getServiceHeaderClass = (status: string) => {
  switch (status) {
    case 'healthy':
      return 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-900';
    case 'warning':
      return 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-900';
    case 'error':
      return 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-900';
    default:
      return 'bg-gray-50 border-gray-200 dark:bg-gray-900 dark:border-gray-800';
  }
};

// 获取事件类型文本
const getEventTypeText = (type: string) => {
  switch (type) {
    case 'info':
      return '信息';
    case 'warning':
      return '警告';
    case 'error':
      return '错误';
    case 'success':
      return '成功';
    default:
      return type;
  }
};

// 获取事件类型标签样式类
const getEventTypeBadgeClass = (type: string) => {
  switch (type) {
    case 'info':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    case 'warning':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    case 'error':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    case 'success':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  }
};

// 获取事件行样式类
const getEventRowClass = (type: string) => {
  switch (type) {
    case 'error':
      return 'bg-red-50 dark:bg-red-900/10';
    case 'warning':
      return 'bg-yellow-50 dark:bg-yellow-900/10';
    default:
      return '';
  }
};

// 初始化
onMounted(async () => {
  await refreshStatus();
  startAutoRefresh();
});

// 清理
onUnmounted(() => {
  if (refreshInterval.value !== null) {
    clearInterval(refreshInterval.value);
  }
});
</script> 