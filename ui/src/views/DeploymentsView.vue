<script setup lang="ts">
import { ref, onMounted } from 'vue';

interface Deployment {
  id: number;
  name: string;
  version: string;
  status: 'pending' | 'success' | 'failed';
  timestamp: string;
  environment?: string;
  details?: string;
}

const deployments = ref<Deployment[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:9700/api';

// 获取部署数据
const fetchDeployments = async () => {
  loading.value = true;
  error.value = null;
  
  try {
    const response = await fetch(`${API_BASE_URL}/deploy`);
    
    if (!response.ok) {
      throw new Error(`API错误: ${response.status}`);
    }
    
    const data = await response.json();
    deployments.value = data;
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

// 生成模拟部署数据
const generateMockDeployments = (): Deployment[] => {
  const services = ['api-service', 'ui', 'database', 'cache', 'authentication'];
  const environments = ['production', 'staging', 'development'];
  const statuses: Array<'pending' | 'success' | 'failed'> = ['pending', 'success', 'failed'];
  
  const mockDeployments: Deployment[] = [];
  
  for (let i = 0; i < 10; i++) {
    const name = services[Math.floor(Math.random() * services.length)];
    const environment = environments[Math.floor(Math.random() * environments.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const version = `v${Math.floor(Math.random() * 5)}.${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 20)}`;
    
    // 创建时间戳，最近7天内的随机时间
    const timestamp = new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000));
    
    mockDeployments.push({
      id: i + 1,
      name,
      version,
      status,
      environment,
      timestamp: timestamp.toISOString(),
      details: status === 'failed' ? '部署过程中出现错误，请检查日志' : undefined
    });
  }
  
  return mockDeployments.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

// 格式化时间戳
const formatTimestamp = (timestamp: string) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleString();
};

// 获取状态颜色
const getStatusColor = (status: string) => {
  switch (status) {
    case 'success':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case 'pending':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    case 'failed':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  }
};

// 组件挂载时获取数据
onMounted(() => {
  fetchDeployments();
});
</script>

<template>
  <div class="container mx-auto px-4 py-6">
    <div class="mb-6 flex justify-between items-center">
      <h1 class="text-2xl font-semibold">部署历史</h1>
      <div class="flex space-x-2">
        <button 
          @click="fetchDeployments" 
          class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          :disabled="loading"
        >
          {{ loading ? '加载中...' : '刷新' }}
        </button>
      </div>
    </div>
    
    <!-- 错误信息 -->
    <div v-if="error" class="mb-6 p-4 bg-red-900/30 text-red-400 rounded-md">
      <p>加载部署数据失败: {{ error }}</p>
    </div>
    
    <!-- 部署列表 -->
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
      
      <div v-else-if="!deployments || deployments.length === 0" class="p-6 text-center text-gray-500">
        没有找到部署记录
      </div>
      
      <div v-else>
        <table class="min-w-full divide-y divide-gray-800">
          <thead class="bg-[#1c1c1c]">
            <tr>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">服务</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">版本</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">环境</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">状态</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">时间</th>
            </tr>
          </thead>
          <tbody class="bg-[#212121] divide-y divide-gray-800">
            <tr v-for="deployment in deployments" :key="deployment.id" class="hover:bg-[#2a2a2a] transition-colors">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-white">{{ deployment.name }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-white">{{ deployment.version }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-400">{{ deployment.environment || '-' }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span 
                  class="px-2 py-1 text-xs font-medium rounded"
                  :class="getStatusColor(deployment.status)"
                >
                  {{ deployment.status }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                {{ formatTimestamp(deployment.timestamp) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template> 