<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';

interface LogEntry {
  id?: number;
  level: string;
  message: string;
  service?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

const logs = ref<LogEntry[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);
const filter = ref({
  level: '',
  service: '',
  timeRange: '24h'
});

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:9700/api';

// 获取日志数据
const fetchLogs = async () => {
  loading.value = true;
  error.value = null;
  
  try {
    let url = `${API_BASE_URL}/logs?limit=100`;
    
    if (filter.value.level) {
      url += `&level=${filter.value.level}`;
    }
    
    if (filter.value.service) {
      url += `&service=${filter.value.service}`;
    }
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`API错误: ${response.status}`);
    }
    
    const data = await response.json();
    logs.value = data;
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

// 生成模拟日志
const generateMockLogs = (): LogEntry[] => {
  const logLevels = ['error', 'warn', 'info', 'debug'];
  const services = ['api', 'database', 'auth', 'monitoring', 'frontend'];
  const messages = [
    'Application started successfully',
    'Database connection failed',
    'High CPU usage detected',
    'User login successful',
    'Cache invalidated',
    'Background job completed',
    'Rate limit exceeded',
    'API request timeout',
    'Memory usage increased',
    'Scheduled task started'
  ];
  
  const mockLogs: LogEntry[] = [];
  
  for (let i = 0; i < 20; i++) {
    const level = logLevels[Math.floor(Math.random() * logLevels.length)];
    const service = services[Math.floor(Math.random() * services.length)];
    const message = messages[Math.floor(Math.random() * messages.length)];
    
    // 创建时间戳，最近24小时内的随机时间
    const timestamp = new Date(Date.now() - Math.floor(Math.random() * 24 * 60 * 60 * 1000));
    
    mockLogs.push({
      id: i + 1,
      level,
      message,
      service,
      timestamp: timestamp.toISOString(),
      metadata: { requestId: `req_${Math.random().toString(36).substring(2, 10)}` }
    });
  }
  
  return mockLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

// 生成模拟日志到服务器
const generateServerMockLogs = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/logs/generate-mock`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`API错误: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.success) {
      fetchLogs(); // 重新获取日志
    }
  } catch (err) {
    console.error('生成模拟日志错误:', err);
    error.value = err instanceof Error ? err.message : '未知错误';
  }
};

// 格式化时间戳
const formatTimestamp = (timestamp: string) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleString();
};

// 获取日志级别颜色
const getLevelColor = (level: string) => {
  switch (level?.toLowerCase()) {
    case 'error':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    case 'warn':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    case 'info':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    case 'debug':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  }
};

// 重置筛选条件
const resetFilters = () => {
  filter.value = {
    level: '',
    service: '',
    timeRange: '24h'
  };
  fetchLogs();
};

// 获取唯一服务列表
const uniqueServices = computed(() => {
  const services = new Set<string>();
  logs.value.forEach(log => {
    if (log.service) {
      services.add(log.service);
    }
  });
  return Array.from(services);
});

// 组件挂载时获取数据
onMounted(() => {
  fetchLogs();
});
</script>

<template>
  <div class="container mx-auto px-4 py-6">
    <div class="mb-6 flex justify-between items-center">
      <h1 class="text-2xl font-semibold">系统日志</h1>
      <div class="flex space-x-2">
        <button 
          @click="fetchLogs" 
          class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          :disabled="loading"
        >
          {{ loading ? '加载中...' : '刷新' }}
        </button>
        <button 
          @click="generateServerMockLogs" 
          class="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
        >
          生成模拟日志
        </button>
      </div>
    </div>
    
    <!-- 筛选器 -->
    <div class="mb-6 p-4 bg-[#212121] rounded-md border border-gray-800">
      <h2 class="text-lg font-medium mb-3">筛选</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-400 mb-1">日志级别</label>
          <select 
            v-model="filter.level"
            class="w-full bg-[#2a2a2a] border border-gray-700 rounded-md px-3 py-2 text-white"
            @change="fetchLogs"
          >
            <option value="">全部</option>
            <option value="error">Error</option>
            <option value="warn">Warn</option>
            <option value="info">Info</option>
            <option value="debug">Debug</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-400 mb-1">服务</label>
          <select 
            v-model="filter.service"
            class="w-full bg-[#2a2a2a] border border-gray-700 rounded-md px-3 py-2 text-white"
            @change="fetchLogs"
          >
            <option value="">全部</option>
            <option v-for="service in uniqueServices" :key="service" :value="service">
              {{ service }}
            </option>
          </select>
        </div>
        <div class="flex items-end">
          <button 
            @click="resetFilters" 
            class="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors"
          >
            重置筛选
          </button>
        </div>
      </div>
    </div>
    
    <!-- 错误信息 -->
    <div v-if="error" class="mb-6 p-4 bg-red-900/30 text-red-400 rounded-md">
      <p>加载日志数据失败: {{ error }}</p>
    </div>
    
    <!-- 日志列表 -->
    <div class="bg-[#212121] rounded-md border border-gray-800 overflow-hidden">
      <div v-if="loading" class="p-6">
        <div class="animate-pulse space-y-4">
          <div class="h-4 bg-gray-700 rounded w-3/4"></div>
          <div class="h-4 bg-gray-700 rounded w-1/2"></div>
          <div class="h-4 bg-gray-700 rounded w-5/6"></div>
          <div class="h-4 bg-gray-700 rounded w-2/3"></div>
          <div class="h-4 bg-gray-700 rounded w-3/4"></div>
        </div>
      </div>
      
      <div v-else-if="!logs || logs.length === 0" class="p-6 text-center text-gray-500">
        没有找到符合条件的日志
      </div>
      
      <div v-else>
        <table class="min-w-full divide-y divide-gray-800">
          <thead class="bg-[#1c1c1c]">
            <tr>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">级别</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">消息</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">服务</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">时间</th>
            </tr>
          </thead>
          <tbody class="bg-[#212121] divide-y divide-gray-800">
            <tr v-for="log in logs" :key="log.id || log.timestamp" class="hover:bg-[#2a2a2a] transition-colors">
              <td class="px-6 py-4 whitespace-nowrap">
                <span 
                  class="px-2 py-1 text-xs font-medium rounded"
                  :class="getLevelColor(log.level)"
                >
                  {{ log.level }}
                </span>
              </td>
              <td class="px-6 py-4">
                <div class="text-sm text-white">{{ log.message }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-400">{{ log.service || '-' }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                {{ formatTimestamp(log.timestamp) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template> 