<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import ChevronRightIcon from '@/assets/icons/ChevronRightIcon.vue';
import ArrowPathIcon from '@/assets/icons/ArrowPathIcon.vue';

// 系统指标接口
interface SystemMetrics {
  cpu: {
    usage: number;     // CPU使用率 (百分比)
    temperature: number; // CPU温度 (摄氏度)
  };
  memory: {
    total: number;     // 总内存 (MB)
    used: number;      // 已使用内存 (MB)
    free: number;      // 空闲内存 (MB)
  };
  disk: {
    total: number;     // 总磁盘空间 (MB)
    used: number;      // 已使用磁盘空间 (MB)
    free: number;      // 空闲磁盘空间 (MB)
  };
  network: {
    bytesIn: number;   // 入站流量 (bytes)
    bytesOut: number;  // 出站流量 (bytes)
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
      metrics.value = generateMockMetrics();
    }
  } finally {
    loading.value = false;
  }
};

// 生成模拟数据（仅开发环境使用）
const generateMockMetrics = (): SystemMetrics => {
  return {
    cpu: {
      usage: Math.round(Math.random() * 80 + 10),
      temperature: Math.round((Math.random() * 30 + 35) * 10) / 10
    },
    memory: {
      total: 16384,
      used: Math.round(Math.random() * 8192 + 4096),
      free: Math.round(Math.random() * 4096 + 2048)
    },
    disk: {
      total: 512 * 1024,
      used: Math.round(Math.random() * 256 * 1024 + 128 * 1024),
      free: Math.round(Math.random() * 128 * 1024)
    },
    network: {
      bytesIn: Math.round(Math.random() * 5 * 1024 * 1024),
      bytesOut: Math.round(Math.random() * 3 * 1024 * 1024)
    }
  };
};

// 手动刷新指标数据
const refreshMetrics = () => {
  fetchLatestMetrics();
};

// 计算属性：内存使用百分比
const memoryUsagePercent = computed(() => {
  if (!metrics.value) return 0;
  return Math.round((metrics.value.memory.used / metrics.value.memory.total) * 100);
});

// 计算属性：磁盘使用百分比
const diskUsagePercent = computed(() => {
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
  <div class="supabase-card p-4 mt-4">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
        <span class="mr-2">系统指标</span>
        <span v-if="metrics && !loading" class="text-xs text-gray-500 dark:text-gray-400">
          更新于 {{ lastUpdated.toLocaleTimeString() }}
        </span>
      </h2>
      <button 
        @click="refreshMetrics" 
        class="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        :disabled="loading"
      >
        <ArrowPathIcon class="h-5 w-5 text-gray-500 dark:text-gray-400" :class="{ 'animate-spin': loading }" />
      </button>
    </div>
    
    <div v-if="error" class="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-md mb-4">
      <p>加载指标数据失败: {{ error }}</p>
      <button 
        @click="refreshMetrics"
        class="mt-2 px-3 py-1 bg-red-200 dark:bg-red-900/50 hover:bg-red-300 dark:hover:bg-red-900/70 rounded-md text-sm text-red-700 dark:text-red-200"
      >
        重试
      </button>
    </div>
    
    <div v-if="loading && !metrics" class="animate-pulse">
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div v-for="i in 4" :key="i" class="h-24 bg-gray-200 dark:bg-gray-800 rounded-md"></div>
      </div>
      <div class="h-6 bg-gray-200 dark:bg-gray-800 rounded-md w-3/4 mb-2"></div>
      <div class="h-6 bg-gray-200 dark:bg-gray-800 rounded-md w-1/2"></div>
    </div>
    
    <div v-else-if="metrics">
      <!-- 主要指标卡片 -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <!-- CPU 使用率 -->
        <div class="bg-white dark:bg-[#212121] rounded-md p-3 border border-gray-200 dark:border-gray-800 shadow-sm">
          <div class="text-xs text-gray-500 dark:text-gray-400 mb-2">CPU 使用率</div>
          <div class="flex items-end">
            <div class="text-2xl font-semibold text-gray-900 dark:text-white">
              {{ metrics.cpu.usage.toFixed(1) }}%
            </div>
            <div 
              class="ml-2 w-3 h-3 rounded-full" 
              :class="getStatusColor(metrics.cpu.usage, {low: 20, medium: 60, high: 85})"
            ></div>
          </div>
          <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
            温度: {{ metrics.cpu.temperature.toFixed(1) }}°C
          </div>
          <div class="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
            <div 
              class="h-1.5 rounded-full"
              :class="getStatusColor(metrics.cpu.usage, {low: 20, medium: 60, high: 85})"
              :style="`width: ${metrics.cpu.usage}%`"
            ></div>
          </div>
        </div>
        
        <!-- 内存使用率 -->
        <div class="bg-white dark:bg-[#212121] rounded-md p-3 border border-gray-200 dark:border-gray-800 shadow-sm">
          <div class="text-xs text-gray-500 dark:text-gray-400 mb-2">内存使用率</div>
          <div class="flex items-end">
            <div class="text-2xl font-semibold text-gray-900 dark:text-white">
              {{ memoryUsagePercent }}%
            </div>
            <div 
              class="ml-2 w-3 h-3 rounded-full" 
              :class="getStatusColor(memoryUsagePercent, {low: 30, medium: 70, high: 90})"
            ></div>
          </div>
          <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {{ formatBytes(metrics.memory.used) }} / {{ formatBytes(metrics.memory.total) }}
          </div>
          <div class="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
            <div 
              class="h-1.5 rounded-full"
              :class="getStatusColor(memoryUsagePercent, {low: 30, medium: 70, high: 90})"
              :style="`width: ${memoryUsagePercent}%`"
            ></div>
          </div>
        </div>
        
        <!-- 磁盘使用率 -->
        <div class="bg-white dark:bg-[#212121] rounded-md p-3 border border-gray-200 dark:border-gray-800 shadow-sm">
          <div class="text-xs text-gray-500 dark:text-gray-400 mb-2">磁盘使用率</div>
          <div class="flex items-end">
            <div class="text-2xl font-semibold text-gray-900 dark:text-white">
              {{ diskUsagePercent }}%
            </div>
            <div 
              class="ml-2 w-3 h-3 rounded-full" 
              :class="getStatusColor(diskUsagePercent, {low: 20, medium: 65, high: 85})"
            ></div>
          </div>
          <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {{ formatBytes(metrics.disk.free) }} 可用
          </div>
          <div class="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
            <div 
              class="h-1.5 rounded-full"
              :class="getStatusColor(diskUsagePercent, {low: 20, medium: 65, high: 85})"
              :style="`width: ${diskUsagePercent}%`"
            ></div>
          </div>
        </div>
        
        <!-- 网络流量 -->
        <div class="bg-white dark:bg-[#212121] rounded-md p-3 border border-gray-200 dark:border-gray-800 shadow-sm">
          <div class="text-xs text-gray-500 dark:text-gray-400 mb-2">网络流量</div>
          <div class="flex items-end">
            <div class="text-2xl font-semibold text-gray-900 dark:text-white">
              {{ formatBytes(metrics.network.bytesIn) }}
            </div>
          </div>
          <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
            入站: {{ formatBytes(metrics.network.bytesIn) }}
          </div>
          <div class="text-xs text-gray-500 dark:text-gray-400">
            出站: {{ formatBytes(metrics.network.bytesOut) }}
          </div>
        </div>
      </div>
      
      <!-- 更多详情链接 -->
      <div class="text-right">
        <router-link 
          to="/metrics" 
          class="inline-flex items-center text-sm text-gray-400 hover:text-white transition-colors"
        >
          查看详细指标 
          <ChevronRightIcon class="h-4 w-4 ml-1" />
        </router-link>
      </div>
    </div>
  </div>
</template> 