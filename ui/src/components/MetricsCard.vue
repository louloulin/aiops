<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import ChevronRightIcon from '@/assets/icons/ChevronRightIcon.vue';
import ArrowPathIcon from '@/assets/icons/ArrowPathIcon.vue';

// 系统指标接口
interface SystemMetrics {
  cpu: {
    usage: number;     // CPU使用率 (百分比)
    temperature: number; // CPU温度 (摄氏度)
    cores: number;      // CPU核心数
  };
  memory: {
    total: number;     // 总内存 (字节)
    used: number;      // 已使用内存 (字节)
    free: number;      // 可用内存 (字节)
  };
  disk: {
    total: number;     // 总磁盘空间 (字节)
    used: number;      // 已使用空间 (字节)
    free: number;      // 可用空间 (字节)
  };
  network: {
    download: number;  // 下载速率 (字节/秒)
    upload: number;    // 上传速率 (字节/秒)
  };
}

// 定义指标数据和加载状态
const metrics = ref<SystemMetrics | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);
const lastUpdated = ref<Date>(new Date());

// API基础URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:9700/api';

// 获取最新系统指标
const fetchLatestMetrics = async (): Promise<void> => {
  loading.value = true;
  error.value = null;
  
  try {
    const response = await fetch(`${API_BASE_URL}/metrics/latest`);
    
    if (!response.ok) {
      throw new Error(`API错误: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.success && data.data) {
      metrics.value = data.data;
      lastUpdated.value = new Date();
    } else {
      throw new Error('获取指标数据失败');
    }
  } catch (err) {
    console.error('获取指标数据错误:', err);
    error.value = err instanceof Error ? err.message : '未知错误';
    
    // 开发环境下使用模拟数据
    if (import.meta.env.DEV) {
      metrics.value = generateMockData();
    }
  } finally {
    loading.value = false;
  }
};

// 生成模拟数据
const generateMockData = (): SystemMetrics => {
  return {
    cpu: {
      usage: Math.round(Math.random() * 80 + 10),
      temperature: Math.round((Math.random() * 30 + 35) * 10) / 10,
      cores: 4
    },
    memory: {
      total: 16 * 1024 * 1024 * 1024,
      used: Math.round(Math.random() * 12 * 1024 * 1024 * 1024),
      free: Math.round(Math.random() * 4 * 1024 * 1024 * 1024)
    },
    disk: {
      total: 512 * 1024 * 1024 * 1024,
      used: Math.round(Math.random() * 350 * 1024 * 1024 * 1024),
      free: Math.round(Math.random() * 162 * 1024 * 1024 * 1024)
    },
    network: {
      download: Math.round(Math.random() * 15 * 1024 * 1024),
      upload: Math.round(Math.random() * 5 * 1024 * 1024)
    }
  };
};

// 手动刷新指标数据
const refreshMetrics = () => {
  fetchLatestMetrics();
};

// 计算内存使用百分比
const memoryUsagePercentage = computed(() => {
  if (!metrics.value) return 0;
  return Math.round((metrics.value.memory.used / metrics.value.memory.total) * 100);
});

// 计算磁盘使用百分比
const diskUsagePercentage = computed(() => {
  if (!metrics.value) return 0;
  return Math.round((metrics.value.disk.used / metrics.value.disk.total) * 100);
});

// 格式化字节为人类可读格式
const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  
  return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
};

// 获取指标状态颜色
const getStatusColor = (value: number, thresholds: {low: number, medium: number, high: number}): string => {
  if (value >= thresholds.high) return 'bg-red-500';
  if (value >= thresholds.medium) return 'bg-yellow-500';
  if (value >= thresholds.low) return 'bg-green-500 dark:bg-emerald-500';
  return 'bg-gray-400 dark:bg-gray-500';
};

// 组件挂载时获取数据
onMounted(() => {
  fetchLatestMetrics();
  
  // 每60秒自动刷新一次
  const interval = setInterval(fetchLatestMetrics, 60000);
  
  // 组件卸载时清除定时器
  onUnmounted(() => {
    clearInterval(interval);
  });
});
</script>

<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
    <div class="p-4">
      <div class="flex justify-between items-start">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">系统指标</h2>
        <button 
          @click="fetchLatestMetrics" 
          class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 p-1 rounded-full"
          :disabled="loading"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            class="h-5 w-5" 
            :class="{ 'animate-spin': loading }"
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>
      
      <div v-if="error" class="mt-4 p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-md">
        {{ error }}
      </div>
      
      <div v-if="loading && !metrics" class="mt-4 space-y-4">
        <div class="animate-pulse flex space-x-4">
          <div class="flex-1 space-y-2 py-1">
            <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
          </div>
        </div>
      </div>
      
      <div v-else-if="metrics" class="mt-4 space-y-6">
        <!-- CPU Usage -->
        <div>
          <div class="flex justify-between items-center mb-2">
            <div class="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-500 dark:text-blue-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm2-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2z" clip-rule="evenodd" />
                <path d="M5 8h10v2H5V8z" />
              </svg>
              <span class="text-gray-700 dark:text-gray-300 font-medium">CPU 使用率</span>
            </div>
            <span class="text-gray-900 dark:text-white font-semibold">{{ metrics.cpu.usage.toFixed(1) }}%</span>
          </div>
          <div class="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div 
              class="h-full bg-blue-500 dark:bg-blue-400 rounded-full" 
              :style="{ width: `${metrics.cpu.usage}%` }"
            ></div>
          </div>
          <div class="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
            <span>{{ metrics.cpu.cores || '4' }} 核心</span>
            <span>{{ metrics.cpu.temperature }}°C</span>
          </div>
        </div>
        
        <!-- Memory Usage -->
        <div>
          <div class="flex justify-between items-center mb-2">
            <div class="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-green-500 dark:text-green-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                <path fill-rule="evenodd" d="M2 9h16v8a2 2 0 01-2 2H4a2 2 0 01-2-2V9zm2 0h12v8H4V9z" clip-rule="evenodd" />
              </svg>
              <span class="text-gray-700 dark:text-gray-300 font-medium">内存使用率</span>
            </div>
            <span class="text-gray-900 dark:text-white font-semibold">{{ formatBytes(metrics.memory.used) }} / {{ formatBytes(metrics.memory.total) }}</span>
          </div>
          <div class="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div 
              class="h-full bg-green-500 dark:bg-green-400 rounded-full" 
              :style="{ width: `${memoryUsagePercentage}%` }"
            ></div>
          </div>
          <div class="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
            <span>可用：{{ formatBytes(metrics.memory.free) }}</span>
            <span>{{ memoryUsagePercentage.toFixed(1) }}%</span>
          </div>
        </div>
        
        <!-- Disk Usage -->
        <div>
          <div class="flex justify-between items-center mb-2">
            <div class="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-purple-500 dark:text-purple-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V5zm12 0H5v10h10V5z" clip-rule="evenodd" />
                <path d="M4 12h12v2H4v-2z" />
              </svg>
              <span class="text-gray-700 dark:text-gray-300 font-medium">磁盘使用率</span>
            </div>
            <span class="text-gray-900 dark:text-white font-semibold">{{ formatBytes(metrics.disk.used) }} / {{ formatBytes(metrics.disk.total) }}</span>
          </div>
          <div class="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div 
              class="h-full bg-purple-500 dark:bg-purple-400 rounded-full" 
              :style="{ width: `${diskUsagePercentage}%` }"
            ></div>
          </div>
          <div class="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
            <span>可用：{{ formatBytes(metrics.disk.free) }}</span>
            <span>{{ diskUsagePercentage.toFixed(1) }}%</span>
          </div>
        </div>
        
        <!-- Network Traffic -->
        <div>
          <div class="flex justify-between items-center mb-2">
            <div class="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-red-500 dark:text-red-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1z" clip-rule="evenodd" />
              </svg>
              <span class="text-gray-700 dark:text-gray-300 font-medium">网络流量</span>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <div class="flex justify-between items-center mb-1">
                <span class="text-xs text-gray-500 dark:text-gray-400">下载</span>
                <span class="text-xs font-medium text-gray-700 dark:text-gray-300">{{ formatBytes(metrics.network.download) }}/s</span>
              </div>
              <div class="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div class="h-full bg-red-500 dark:bg-red-400 rounded-full" style="width: 65%"></div>
              </div>
            </div>
            <div>
              <div class="flex justify-between items-center mb-1">
                <span class="text-xs text-gray-500 dark:text-gray-400">上传</span>
                <span class="text-xs font-medium text-gray-700 dark:text-gray-300">{{ formatBytes(metrics.network.upload) }}/s</span>
              </div>
              <div class="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div class="h-full bg-red-500 dark:bg-red-400 rounded-full" style="width: 40%"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="mt-4 text-xs text-gray-500 dark:text-gray-400 flex justify-between">
        <span>最后更新: {{ lastUpdated }}</span>
        <span>刷新间隔: 30s</span>
      </div>
    </div>
  </div>
</template> 