<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import ChevronRightIcon from '@/assets/icons/ChevronRightIcon.vue';
import ArrowPathIcon from '@/assets/icons/ArrowPathIcon.vue';

interface Deployment {
  id: string;
  name: string;
  status: 'running' | 'pending' | 'failed' | 'completed';
  environment: string;
  timestamp: string;
  progress?: number;
}

const deployments = ref<Deployment[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);

// API基础URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:9700/api';

// 获取最新部署
const fetchLatestDeployments = async (): Promise<void> => {
  loading.value = true;
  error.value = null;
  
  try {
    const response = await fetch(`${API_BASE_URL}/deployments/latest?limit=4`);
    
    if (!response.ok) {
      throw new Error(`API错误: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.success && data.deployments) {
      deployments.value = data.deployments;
    } else {
      throw new Error('获取部署数据失败');
    }
  } catch (err) {
    console.error('获取部署数据错误:', err);
    error.value = err instanceof Error ? err.message : '未知错误';
    
    // 开发环境下使用模拟数据
    if (import.meta.env.DEV) {
      deployments.value = generateMockDeployments();
    }
  } finally {
    loading.value = false;
  }
};

// 生成模拟部署（仅开发环境使用）
const generateMockDeployments = (): Deployment[] => {
  const names = ['API Service', 'Web Frontend', 'Database Migration', 'Batch Process'];
  const statuses = ['running', 'pending', 'failed', 'completed'] as const;
  const environments = ['production', 'staging', 'development'];
  
  return Array.from({ length: 4 }, (_, i) => {
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const timestamp = new Date(Date.now() - i * 3600000 - Math.random() * 86400000);
    
    return {
      id: `dep-${Math.random().toString(36).substr(2, 9)}`,
      name: names[i % names.length],
      status,
      environment: environments[Math.floor(Math.random() * environments.length)],
      timestamp: timestamp.toISOString(),
      progress: status === 'running' ? Math.floor(Math.random() * 80 + 10) : undefined
    };
  });
};

// 手动刷新部署
const refreshDeployments = () => {
  fetchLatestDeployments();
};

// 获取部署状态样式
const getStatusStyle = (status: string): Record<string, string> => {
  switch (status) {
    case 'running':
      return {
        badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
        icon: 'text-blue-500 animate-pulse'
      };
    case 'pending':
      return {
        badge: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
        icon: 'text-yellow-500'
      };
    case 'failed':
      return {
        badge: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
        icon: 'text-red-500'
      };
    case 'completed':
      return {
        badge: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
        icon: 'text-green-500'
      };
    default:
      return {
        badge: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
        icon: 'text-gray-500'
      };
  }
};

// 格式化日期时间
const formatTimestamp = (timestamp: string): string => {
  try {
    const date = new Date(timestamp);
    return date.toLocaleString([], { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  } catch (e) {
    return timestamp;
  }
};

// 组件挂载时获取数据
onMounted(() => {
  fetchLatestDeployments();
  
  // 每60秒自动刷新一次
  const interval = setInterval(fetchLatestDeployments, 60000);
  
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
        <span>最新部署</span>
      </h2>
      <div class="flex">
        <button 
          @click="refreshDeployments" 
          class="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          :disabled="loading"
        >
          <ArrowPathIcon class="h-5 w-5 text-gray-500 dark:text-gray-400" :class="{ 'animate-spin': loading }" />
        </button>
        <router-link 
          to="/deployments" 
          class="ml-2 p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center"
        >
          <ChevronRightIcon class="h-5 w-5 text-gray-500 dark:text-gray-400" />
        </router-link>
      </div>
    </div>
    
    <div v-if="error" class="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-md mb-4">
      <p>加载部署数据失败: {{ error }}</p>
      <button 
        @click="refreshDeployments"
        class="mt-2 px-3 py-1 bg-red-200 dark:bg-red-900/50 hover:bg-red-300 dark:hover:bg-red-900/70 rounded-md text-sm text-red-700 dark:text-red-200"
      >
        重试
      </button>
    </div>
    
    <div v-if="loading && deployments.length === 0" class="animate-pulse">
      <div v-for="i in 4" :key="i" class="h-16 bg-gray-200 dark:bg-gray-800 rounded-md mb-3"></div>
    </div>
    
    <div v-else-if="deployments.length > 0">
      <div class="space-y-3">
        <div 
          v-for="deployment in deployments" 
          :key="deployment.id"
          class="bg-white dark:bg-[#212121] rounded-md p-3 border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md dark:hover:border-gray-700 transition-all"
        >
          <div class="flex justify-between items-start mb-2">
            <div>
              <div class="font-medium text-gray-900 dark:text-white">{{ deployment.name }}</div>
              <div class="text-xs text-gray-500 dark:text-gray-400">
                {{ deployment.environment }} • {{ formatTimestamp(deployment.timestamp) }}
              </div>
            </div>
            <span 
              class="px-2 py-1 text-xs font-medium rounded-full"
              :class="getStatusStyle(deployment.status).badge"
            >
              {{ deployment.status }}
            </span>
          </div>
          
          <div v-if="deployment.status === 'running' && deployment.progress !== undefined" class="mt-2">
            <div class="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
              <span>进度</span>
              <span>{{ deployment.progress }}%</span>
            </div>
            <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
              <div 
                class="bg-blue-500 h-1.5 rounded-full"
                :style="`width: ${deployment.progress}%`"
              ></div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="mt-3 text-right">
        <router-link to="/deployments" class="text-xs text-blue-500 hover:text-blue-600 dark:hover:text-blue-400">
          查看所有部署
        </router-link>
      </div>
    </div>
    
    <div v-else class="bg-gray-100 dark:bg-gray-800 p-4 rounded-md text-center text-gray-500 dark:text-gray-400">
      暂无部署数据
    </div>
  </div>
</template> 