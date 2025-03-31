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
  url: string;
}

// State
const dataSources = ref<DataSource[]>([]);
const loading = ref(true);
const searchQuery = ref('');
const selectedType = ref<string>('all');
const showAddModal = ref(false);
const showDeleteConfirm = ref(false);
const currentDataSource = ref<DataSource | null>(null);
const isDeleting = ref(false);
const deleteError = ref<string | null>(null);
const isTesting = ref(false);
const testResult = ref<{ success: boolean; message: string; latency: number } | null>(null);

// 新增表单状态
const formData = ref({
  name: '',
  type: 'prometheus' as DataSource['type'],
  url: '',
  description: '',
  apiKey: ''
});
const formErrors = ref<Record<string, string>>({});
const isSubmitting = ref(false);
const addSuccess = ref(false);
const addError = ref<string | null>(null);
const isEditing = ref(false);

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
    const baseName = `${type.charAt(0).toUpperCase() + type.slice(1)} ${i + 1}`;
    return {
      id: `ds-${i + 1}`,
      name: baseName,
      type,
      status: statusOptions[Math.floor(Math.random() * statusOptions.length)] as DataSource['status'],
      lastSync: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      description: `${type.charAt(0).toUpperCase() + type.slice(1)} data source for monitoring system ${i + 1}`,
      metrics: Math.floor(Math.random() * 1000) + 50,
      url: `https://${type}.example.com/${baseName.toLowerCase().replace(/\s+/g, '-')}`
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

// 验证表单数据
const validateForm = (): boolean => {
  const errors: Record<string, string> = {};
  
  if (!formData.value.name.trim()) {
    errors.name = '数据源名称不能为空';
  }
  
  if (!formData.value.url.trim()) {
    errors.url = 'URL不能为空';
  } else if (!/^https?:\/\/.+/.test(formData.value.url)) {
    errors.url = '请输入有效的URL（以http://或https://开头）';
  }
  
  formErrors.value = errors;
  return Object.keys(errors).length === 0;
};

// 重置表单数据
const resetForm = () => {
  formData.value = {
    name: '',
    type: 'prometheus',
    url: '',
    description: '',
    apiKey: ''
  };
  formErrors.value = {};
  addSuccess.value = false;
  addError.value = null;
};

// 打开添加模态框
const openAddModal = () => {
  resetForm();
  isEditing.value = false;
  currentDataSource.value = null;
  showAddModal.value = true;
};

// 关闭模态框
const closeAddModal = () => {
  showAddModal.value = false;
  isEditing.value = false;
  currentDataSource.value = null;
};

// 打开编辑模态框
const openEditModal = (dataSource: DataSource) => {
  currentDataSource.value = dataSource;
  
  // 复制数据到表单
  formData.value = {
    name: dataSource.name,
    type: dataSource.type,
    url: dataSource.url,
    description: dataSource.description,
    apiKey: '' // 出于安全考虑，不加载已保存的API密钥
  };
  
  // 重置表单状态
  formErrors.value = {};
  addSuccess.value = false;
  addError.value = null;
  
  showAddModal.value = true;
  isEditing.value = true;
};

// 修改提交表单函数以支持编辑
const submitAddForm = async () => {
  if (!validateForm()) {
    return;
  }
  
  isSubmitting.value = true;
  addSuccess.value = false;
  addError.value = null;
  
  try {
    const payload = {
      name: formData.value.name,
      type: formData.value.type,
      url: formData.value.url,
      description: formData.value.description,
      credentials: formData.value.apiKey ? { apiKey: formData.value.apiKey } : undefined
    };
    
    let response;
    
    if (isEditing.value && currentDataSource.value) {
      // 更新现有数据源
      response = await fetch(`${API_BASE_URL}/datasources/${currentDataSource.value.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
    } else {
      // 添加新数据源
      response = await fetch(`${API_BASE_URL}/datasources`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
    }
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || (isEditing.value ? '更新数据源失败' : '添加数据源失败'));
    }
    
    addSuccess.value = true;
    // 刷新数据源列表
    fetchDataSources();
    
    // 3秒后关闭模态框
    setTimeout(() => {
      if (addSuccess.value) {
        closeAddModal();
      }
    }, 3000);
  } catch (error) {
    console.error(isEditing.value ? 'Error updating data source:' : 'Error adding data source:', error);
    addError.value = error instanceof Error ? error.message : (isEditing.value ? '更新数据源时发生错误' : '添加数据源时发生错误');
  } finally {
    isSubmitting.value = false;
  }
};

// 删除数据源
const deleteDataSource = async () => {
  if (!currentDataSource.value) return;
  
  isDeleting.value = true;
  deleteError.value = null;
  
  try {
    const response = await fetch(`${API_BASE_URL}/datasources/${currentDataSource.value.id}`, {
      method: 'DELETE'
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || '删除数据源失败');
    }
    
    // 刷新数据源列表
    fetchDataSources();
    // 关闭确认对话框
    closeDeleteConfirm();
  } catch (error) {
    console.error('Error deleting data source:', error);
    deleteError.value = error instanceof Error ? error.message : '删除数据源时发生错误';
  } finally {
    isDeleting.value = false;
  }
};

// 打开删除确认对话框
const openDeleteConfirm = (dataSource: DataSource) => {
  currentDataSource.value = dataSource;
  showDeleteConfirm.value = true;
};

// 关闭删除确认对话框
const closeDeleteConfirm = () => {
  showDeleteConfirm.value = false;
  currentDataSource.value = null;
  deleteError.value = null;
};

// 测试数据源连接
const testConnection = async (dataSource: DataSource) => {
  currentDataSource.value = dataSource;
  isTesting.value = true;
  testResult.value = null;
  
  try {
    const response = await fetch(`${API_BASE_URL}/datasources/${dataSource.id}/test`, {
      method: 'POST'
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || '测试连接失败');
    }
    
    testResult.value = data.test;
    
    // 刷新数据源列表以获取最新状态
    fetchDataSources();
  } catch (error) {
    console.error('Error testing connection:', error);
    testResult.value = {
      success: false,
      message: error instanceof Error ? error.message : '测试连接时发生错误',
      latency: 0
    };
  } finally {
    isTesting.value = false;
  }
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
                  <button 
                    class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                    title="编辑数据源"
                    @click="openEditModal(source)"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                  </button>
                  <button 
                    class="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300"
                    title="测试连接"
                    @click="testConnection(source)"
                    :disabled="isTesting && currentDataSource?.id === source.id"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd" />
                    </svg>
                  </button>
                  <button 
                    class="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                    title="删除数据源"
                    @click="openDeleteConfirm(source)"
                  >
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
        <h3 class="text-xl font-medium text-gray-900 dark:text-white">{{ isEditing ? '编辑数据源' : '添加数据源' }}</h3>
        <button @click="closeAddModal" class="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div class="p-6 space-y-4">
        <!-- Success Message -->
        <div v-if="addSuccess" class="mb-4 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 p-3 rounded-md flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
          </svg>
          <span>{{ isEditing ? '数据源更新成功！' : '数据源添加成功！' }}</span>
        </div>
        
        <!-- Error Message -->
        <div v-if="addError" class="mb-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 p-3 rounded-md flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
          </svg>
          <span>{{ addError }}</span>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">名称</label>
          <input 
            type="text" 
            class="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg py-2 px-4 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" 
            :class="{ 'border-red-500 dark:border-red-500': formErrors.name }"
            placeholder="我的数据源" 
            v-model="formData.name" 
          />
          <p v-if="formErrors.name" class="mt-1 text-red-500 text-xs">{{ formErrors.name }}</p>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">类型</label>
          <select 
            class="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg py-2 px-4 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" 
            v-model="formData.type"
          >
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
          <input 
            type="text" 
            class="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg py-2 px-4 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" 
            :class="{ 'border-red-500 dark:border-red-500': formErrors.url }"
            placeholder="https://prometheus.example.com" 
            v-model="formData.url" 
          />
          <p v-if="formErrors.url" class="mt-1 text-red-500 text-xs">{{ formErrors.url }}</p>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">描述</label>
          <textarea 
            class="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg py-2 px-4 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" 
            rows="2" 
            placeholder="可选描述" 
            v-model="formData.description"
          ></textarea>
        </div>
        
        <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
          <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-3">认证</h4>
          <div class="space-y-3">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">API密钥</label>
              <input 
                type="password" 
                class="w-full bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded-lg py-2 px-4 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" 
                placeholder="API密钥" 
                v-model="formData.apiKey" 
              />
            </div>
          </div>
        </div>
      </div>
      <div class="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
        <button 
          @click="closeAddModal" 
          class="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-lg"
          :disabled="isSubmitting"
        >
          取消
        </button>
        <button 
          @click="submitAddForm" 
          class="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg flex items-center" 
          :disabled="isSubmitting"
        >
          <svg v-if="isSubmitting" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {{ isSubmitting ? '处理中...' : (isEditing ? '更新数据源' : '添加数据源') }}
        </button>
      </div>
    </div>
  </div>

  <!-- Delete Data Source Modal -->
  <div v-if="showDeleteConfirm" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div class="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md overflow-hidden shadow-lg">
      <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <h3 class="text-xl font-medium text-gray-900 dark:text-white">删除数据源</h3>
        <button @click="closeDeleteConfirm" class="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div class="p-6 space-y-4">
        <!-- Error Message -->
        <div v-if="deleteError" class="mb-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 p-3 rounded-md flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
          </svg>
          <span>{{ deleteError }}</span>
        </div>
        
        <div class="text-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          <p class="text-xl font-medium text-gray-900 dark:text-white mt-4">确定要删除吗？</p>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">
            您确定要删除数据源 "{{ currentDataSource?.name }}"？<br />此操作无法撤销。
          </p>
        </div>
      </div>
      <div class="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
        <button 
          @click="closeDeleteConfirm" 
          class="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-lg"
          :disabled="isDeleting"
        >
          取消
        </button>
        <button 
          @click="deleteDataSource" 
          class="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg flex items-center"
          :disabled="isDeleting"
        >
          <svg v-if="isDeleting" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {{ isDeleting ? '删除中...' : '删除' }}
        </button>
      </div>
    </div>
  </div>
  
  <!-- Test Connection Modal -->
  <div v-if="testResult && currentDataSource" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div class="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md overflow-hidden shadow-lg">
      <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <h3 class="text-xl font-medium text-gray-900 dark:text-white">连接测试结果</h3>
        <button @click="testResult = null; currentDataSource = null;" class="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div class="p-6 space-y-4">
        <div class="text-center">
          <div v-if="testResult.success" class="mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p class="text-xl font-medium text-gray-900 dark:text-white mt-4">连接成功</p>
          </div>
          <div v-else class="mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p class="text-xl font-medium text-gray-900 dark:text-white mt-4">连接失败</p>
          </div>
          
          <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg text-left">
            <div class="flex justify-between mb-2">
              <span class="text-sm text-gray-500 dark:text-gray-400">数据源:</span>
              <span class="text-sm font-medium text-gray-900 dark:text-white">{{ currentDataSource.name }}</span>
            </div>
            <div class="flex justify-between mb-2">
              <span class="text-sm text-gray-500 dark:text-gray-400">URL:</span>
              <span class="text-sm font-medium text-gray-900 dark:text-white">{{ currentDataSource.url || 'N/A' }}</span>
            </div>
            <div class="flex justify-between mb-2">
              <span class="text-sm text-gray-500 dark:text-gray-400">响应时间:</span>
              <span class="text-sm font-medium text-gray-900 dark:text-white">{{ testResult.latency }}ms</span>
            </div>
            <div class="flex justify-between">
              <span class="text-sm text-gray-500 dark:text-gray-400">消息:</span>
              <span class="text-sm font-medium text-gray-900 dark:text-white">{{ testResult.message }}</span>
            </div>
          </div>
        </div>
      </div>
      <div class="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
        <button 
          @click="testResult = null; currentDataSource = null;" 
          class="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg"
        >
          关闭
        </button>
      </div>
    </div>
  </div>
</template> 