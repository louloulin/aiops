<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';

interface DataSource {
  id: string;
  name: string;
  type: 'prometheus' | 'grafana' | 'elasticsearch' | 'cloudwatch' | 'database' | 'custom';
  status: 'connected' | 'error' | 'pending';
  lastSync: Date;
  description: string;
  metrics: number;
}

// State
const dataSources = ref<DataSource[]>([]);
const loading = ref(true);
const searchQuery = ref('');
const selectedType = ref<string>('all');
const showAddModal = ref(false);

// API基础URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:9700/api';

// Computed
const filteredDataSources = computed(() => {
  return dataSources.value.filter(ds => {
    const matchesSearch = ds.name.toLowerCase().includes(searchQuery.value.toLowerCase()) || 
                          ds.description.toLowerCase().includes(searchQuery.value.toLowerCase());
    const matchesType = selectedType.value === 'all' || ds.type === selectedType.value;
    
    return matchesSearch && matchesType;
  });
});

// Methods
const fetchDataSources = async () => {
  try {
    loading.value = true;
    const response = await fetch(`${API_BASE_URL}/datasources`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch data sources');
    }

    const data = await response.json();
    if (data.success) {
      dataSources.value = data.dataSources;
    }
  } catch (error) {
    console.error('Error fetching data sources:', error);
    if (import.meta.env.DEV) {
      generateMockData();
    }
  } finally {
    loading.value = false;
  }
};

const generateMockData = () => {
  const types = ['prometheus', 'grafana', 'elasticsearch', 'cloudwatch', 'database', 'custom'];
  const statusOptions = ['connected', 'error', 'pending'];
  
  dataSources.value = Array.from({ length: 8 }, (_, i) => {
    const type = types[Math.floor(Math.random() * types.length)] as DataSource['type'];
    return {
      id: `ds-${i + 1}`,
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} ${i + 1}`,
      type,
      status: statusOptions[Math.floor(Math.random() * statusOptions.length)] as DataSource['status'],
      lastSync: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      description: `${type.charAt(0).toUpperCase() + type.slice(1)} data source for monitoring system ${i + 1}`,
      metrics: Math.floor(Math.random() * 1000) + 50
    };
  });
};

const formatDate = (date: Date) => {
  return new Date(date).toLocaleString();
};

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'prometheus':
      return 'M-16,0 L16,0 L0,-16 z';
    case 'grafana':
      return 'M0,0 L16,0 L16,16 L0,16 z';
    case 'elasticsearch':
      return 'M8,0 L16,8 L8,16 L0,8 z';
    case 'cloudwatch':
      return 'M0,0 C8,0 16,8 16,16 L0,16 z';
    case 'database':
      return 'M0,0 L16,0 L16,8 C16,16 0,16 0,8 z';
    default:
      return 'M8,0 C16,0 16,16 0,16 C0,0 8,0 8,0 z';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'connected':
      return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
    case 'error':
      return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200';
    case 'pending':
      return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200';
    default:
      return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'connected':
      return 'Connected';
    case 'error':
      return 'Error';
    case 'pending':
      return 'Pending';
    default:
      return 'Unknown';
  }
};

const openAddModal = () => {
  showAddModal.value = true;
};

const closeAddModal = () => {
  showAddModal.value = false;
};

// Initialize
onMounted(() => {
  fetchDataSources();
  // Refresh every 2 minutes
  setInterval(fetchDataSources, 120000);
});
</script>

<template>
  <div class="space-y-4">
    <!-- Filters -->
    <div class="flex flex-col md:flex-row gap-4 justify-between mb-6">
      <div class="flex flex-1 max-w-md">
        <div class="relative w-full">
          <input
            type="text"
            placeholder="搜索数据源..."
            v-model="searchQuery"
            class="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg py-2 px-4 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 pl-10"
          />
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-500 dark:text-gray-400" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" />
            </svg>
          </div>
        </div>
      </div>
      
      <div class="flex gap-4">
        <select
          v-model="selectedType"
          class="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg py-2 px-4 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">全部类型</option>
          <option value="prometheus">Prometheus</option>
          <option value="grafana">Grafana</option>
          <option value="elasticsearch">Elasticsearch</option>
          <option value="cloudwatch">CloudWatch</option>
          <option value="database">数据库</option>
          <option value="custom">自定义</option>
        </select>
        
        <button
          @click="openAddModal"
          class="bg-blue-600 hover:bg-blue-500 text-white rounded-lg px-4 py-2 flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
          </svg>
          添加数据源
        </button>
      </div>
    </div>
    
    <!-- Data Source Table -->
    <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden shadow-sm">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                数据源
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                类型
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                状态
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                最后同步
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                指标数量
              </th>
              <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody v-if="!loading" class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            <tr v-for="source in filteredDataSources" :key="source.id" class="hover:bg-gray-50 dark:hover:bg-gray-750">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-full">
                    <svg class="h-6 w-6 text-blue-600 dark:text-blue-400" viewBox="0 0 24 24" fill="currentColor">
                      <path :d="getTypeIcon(source.type)" />
                    </svg>
                  </div>
                  <div class="ml-4">
                    <div class="text-sm font-medium text-gray-900 dark:text-white">{{ source.name }}</div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">{{ source.description }}</div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900 dark:text-white capitalize">{{ source.type }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full" :class="getStatusColor(source.status)">
                  {{ getStatusText(source.status) }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                {{ formatDate(source.lastSync) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                {{ source.metrics.toLocaleString() }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div class="flex justify-end space-x-2">
                  <button class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                  </button>
                  <button class="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd" />
                    </svg>
                  </button>
                  <button class="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
          <tbody v-else>
            <tr>
              <td colspan="6" class="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                <div class="animate-pulse flex justify-center items-center space-x-4">
                  <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4 max-w-md"></div>
                </div>
              </td>
            </tr>
          </tbody>
          <tbody v-if="!loading && filteredDataSources.length === 0">
            <tr>
              <td colspan="6" class="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                没有找到匹配的数据源
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <!-- Add Data Source Modal -->
  <div v-if="showAddModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div class="bg-white dark:bg-gray-800 rounded-lg w-full max-w-2xl overflow-hidden shadow-lg">
      <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <h3 class="text-xl font-medium text-gray-900 dark:text-white">添加数据源</h3>
        <button @click="closeAddModal" class="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div class="p-6 space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">名称</label>
          <input type="text" class="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg py-2 px-4 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="我的数据源" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">类型</label>
          <select class="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg py-2 px-4 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="prometheus">Prometheus</option>
            <option value="grafana">Grafana</option>
            <option value="elasticsearch">Elasticsearch</option>
            <option value="cloudwatch">CloudWatch</option>
            <option value="database">数据库</option>
            <option value="custom">自定义</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">URL</label>
          <input type="text" class="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg py-2 px-4 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="https://prometheus.example.com" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">描述</label>
          <textarea class="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg py-2 px-4 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" rows="2" placeholder="可选描述"></textarea>
        </div>
        
        <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
          <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-3">认证</h4>
          <div class="space-y-3">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">API密钥</label>
              <input type="password" class="w-full bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded-lg py-2 px-4 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="API密钥" />
            </div>
          </div>
        </div>
      </div>
      <div class="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
        <button @click="closeAddModal" class="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-lg">取消</button>
        <button class="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg">添加数据源</button>
      </div>
    </div>
  </div>
</template> 