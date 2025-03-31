<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import ChevronRightIcon from '@/assets/icons/ChevronRightIcon.vue';
import ArrowPathIcon from '@/assets/icons/ArrowPathIcon.vue';

interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  source: string;
  message: string;
}

const logs = ref<LogEntry[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);

// API基础URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:9700/api';

// 获取最新日志
const fetchLatestLogs = async (): Promise<void> => {
  loading.value = true;
  error.value = null;
  
  try {
    const response = await fetch(`${API_BASE_URL}/logs/latest?limit=6`);
    
    if (!response.ok) {
      throw new Error(`API错误: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.success && data.logs) {
      logs.value = data.logs;
    } else {
      throw new Error('获取日志数据失败');
    }
  } catch (err) {
    console.error('获取日志数据错误:', err);
    error.value = err instanceof Error ? err.message : '未知错误';
    
    // 开发环境下使用模拟数据
    if (import.meta.env.DEV) {
      logs.value = generateMockLogs();
    }
  } finally {
    loading.value = false;
  }
};

// 生成模拟日志（仅开发环境使用）
const generateMockLogs = (): LogEntry[] => {
  const sources = ['system', 'api', 'database', 'auth'];
  const levels = ['info', 'warn', 'error', 'debug'] as const;
  const messages = [
    'Application started successfully',
    'Database connection established',
    'Failed to connect to remote service',
    'User authentication succeeded',
    'CPU usage spike detected',
    'Memory usage above threshold',
    'API request rate limiting applied',
    'Backup process completed successfully'
  ];
  
  return Array.from({ length: 6 }, (_, i) => {
    const timestamp = new Date(Date.now() - i * 60000 - Math.random() * 3600000);
    return {
      timestamp: timestamp.toISOString(),
      level: levels[Math.floor(Math.random() * levels.length)],
      source: sources[Math.floor(Math.random() * sources.length)],
      message: messages[Math.floor(Math.random() * messages.length)]
    };
  });
};

// 手动刷新日志
const refreshLogs = () => {
  fetchLatestLogs();
};

// 获取日志级别样式
const getLogLevelStyle = (level: string): string => {
  switch (level) {
    case 'error': return 'text-red-500';
    case 'warn': return 'text-yellow-500';
    case 'info': return 'text-blue-500';
    case 'debug': return 'text-gray-500 dark:text-gray-400';
    default: return 'text-gray-500 dark:text-gray-400';
  }
};

// 格式化日期时间
const formatTimestamp = (timestamp: string): string => {
  try {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch (e) {
    return timestamp;
  }
};

// 组件挂载时获取数据
onMounted(() => {
  fetchLatestLogs();
  
  // 每30秒自动刷新一次
  const interval = setInterval(fetchLatestLogs, 30000);
  
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
        <span>最新日志</span>
      </h2>
      <div class="flex">
        <button 
          @click="refreshLogs" 
          class="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          :disabled="loading"
        >
          <ArrowPathIcon class="h-5 w-5 text-gray-500 dark:text-gray-400" :class="{ 'animate-spin': loading }" />
        </button>
        <router-link 
          to="/logs" 
          class="ml-2 p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center"
        >
          <ChevronRightIcon class="h-5 w-5 text-gray-500 dark:text-gray-400" />
        </router-link>
      </div>
    </div>
    
    <div v-if="error" class="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-md mb-4">
      <p>加载日志数据失败: {{ error }}</p>
      <button 
        @click="refreshLogs"
        class="mt-2 px-3 py-1 bg-red-200 dark:bg-red-900/50 hover:bg-red-300 dark:hover:bg-red-900/70 rounded-md text-sm text-red-700 dark:text-red-200"
      >
        重试
      </button>
    </div>
    
    <div v-if="loading && logs.length === 0" class="animate-pulse">
      <div v-for="i in 5" :key="i" class="h-8 bg-gray-200 dark:bg-gray-800 rounded mb-2"></div>
    </div>
    
    <div v-else-if="logs.length > 0" class="overflow-hidden">
      <div class="bg-white dark:bg-[#212121] border border-gray-200 dark:border-gray-800 rounded-md shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
            <thead class="bg-gray-100 dark:bg-gray-900">
              <tr>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">时间</th>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">级别</th>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">来源</th>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">消息</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-800">
              <tr v-for="(log, index) in logs" :key="index" 
                class="hover:bg-gray-100 dark:hover:bg-gray-800/70 transition-colors">
                <td class="px-3 py-2 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">
                  {{ formatTimestamp(log.timestamp) }}
                </td>
                <td class="px-3 py-2 whitespace-nowrap text-xs" :class="getLogLevelStyle(log.level)">
                  {{ log.level.toUpperCase() }}
                </td>
                <td class="px-3 py-2 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">
                  {{ log.source }}
                </td>
                <td class="px-3 py-2 text-xs text-gray-700 dark:text-gray-300">
                  {{ log.message }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div class="mt-2 text-right">
        <router-link to="/logs" class="text-xs text-blue-500 hover:text-blue-600 dark:hover:text-blue-400">
          查看全部日志
        </router-link>
      </div>
    </div>
    
    <div v-else class="bg-gray-100 dark:bg-gray-800 p-4 rounded-md text-center text-gray-500 dark:text-gray-400">
      暂无日志数据
    </div>
  </div>
</template> 