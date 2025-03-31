<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';

interface BusinessMetric {
  id: string;
  name: string;
  description: string;
  category: 'user' | 'performance' | 'business' | 'quality' | 'custom';
  query: string;
  dataSource: string;
  thresholds: {
    warning: number | null;
    critical: number | null;
  };
  unit: string;
  aggregation: 'avg' | 'sum' | 'min' | 'max' | 'count';
  created: Date;
  updated: Date;
  status: 'active' | 'inactive' | 'draft';
}

// State
const metrics = ref<BusinessMetric[]>([]);
const loading = ref(true);
const searchQuery = ref('');
const selectedCategory = ref<string>('all');
const showAddModal = ref(false);
const editingMetric = ref<BusinessMetric | null>(null);

// API基础URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:9700/api';

// Computed
const filteredMetrics = computed(() => {
  return metrics.value.filter(metric => {
    const matchesSearch = metric.name.toLowerCase().includes(searchQuery.value.toLowerCase()) || 
                         metric.description.toLowerCase().includes(searchQuery.value.toLowerCase());
    const matchesCategory = selectedCategory.value === 'all' || metric.category === selectedCategory.value;
    
    return matchesSearch && matchesCategory;
  });
});

// Methods
const fetchMetrics = async () => {
  try {
    loading.value = true;
    const response = await fetch(`${API_BASE_URL}/business/metrics/definitions`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch business metrics');
    }

    const data = await response.json();
    if (data.success) {
      metrics.value = data.metrics;
    }
  } catch (error) {
    console.error('Error fetching business metrics:', error);
    if (import.meta.env.DEV) {
      generateMockData();
    }
  } finally {
    loading.value = false;
  }
};

const generateMockData = () => {
  const categories = ['user', 'performance', 'business', 'quality', 'custom'];
  const statuses = ['active', 'inactive', 'draft'];
  const aggregations = ['avg', 'sum', 'min', 'max', 'count'];
  const units = ['ms', 'req/s', '%', 'count', 'MB', 'users'];
  const dataSources = ['Prometheus 1', 'Database 1', 'Custom API'];
  
  const metricTemplates = [
    { name: '用户活跃度', category: 'user', query: 'sum(active_users)' },
    { name: '接口响应时间', category: 'performance', query: 'avg(api_response_time)' },
    { name: '订单成功率', category: 'business', query: 'success_orders / total_orders * 100' },
    { name: '服务可用性', category: 'quality', query: 'uptime / total_time * 100' },
    { name: '并发用户数', category: 'user', query: 'count(distinct user_id)' },
    { name: '每分钟请求数', category: 'performance', query: 'sum(requests) / 60' },
    { name: '销售转化率', category: 'business', query: 'completed_purchases / product_views * 100' },
    { name: '错误率', category: 'quality', query: 'count(errors) / count(requests) * 100' },
    { name: '平均会话时长', category: 'user', query: 'avg(session_duration)' },
    { name: '缓存命中率', category: 'performance', query: 'cache_hits / (cache_hits + cache_misses) * 100' }
  ];
  
  metrics.value = metricTemplates.map((template, i) => {
    const category = template.category as BusinessMetric['category'];
    const aggregation = aggregations[Math.floor(Math.random() * aggregations.length)] as BusinessMetric['aggregation'];
    const unit = units[Math.floor(Math.random() * units.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)] as BusinessMetric['status'];
    const dataSource = dataSources[Math.floor(Math.random() * dataSources.length)];
    
    return {
      id: `bm-${i + 1}`,
      name: template.name,
      description: `${template.name}的监控指标，用于衡量系统的${category}表现`,
      category,
      query: template.query,
      dataSource,
      thresholds: {
        warning: Math.random() > 0.2 ? Math.floor(Math.random() * 90) + 10 : null,
        critical: Math.random() > 0.2 ? Math.floor(Math.random() * 90) + 10 : null
      },
      unit,
      aggregation,
      created: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000),
      updated: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      status
    };
  });
};

const formatDate = (date: Date) => {
  return new Date(date).toLocaleString();
};

const getCategoryLabel = (category: string) => {
  const labels: Record<string, string> = {
    user: '用户指标',
    performance: '性能指标',
    business: '业务指标',
    quality: '质量指标',
    custom: '自定义指标'
  };
  return labels[category] || category;
};

const getCategoryColor = (category: string) => {
  const colors: Record<string, string> = {
    user: 'bg-blue-500',
    performance: 'bg-purple-500',
    business: 'bg-green-500',
    quality: 'bg-orange-500',
    custom: 'bg-gray-500'
  };
  return colors[category] || 'bg-gray-500';
};

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    active: 'bg-green-500',
    inactive: 'bg-gray-500',
    draft: 'bg-yellow-500'
  };
  return colors[status] || 'bg-gray-500';
};

const openAddModal = () => {
  editingMetric.value = null;
  showAddModal.value = true;
};

const openEditModal = (metric: BusinessMetric) => {
  editingMetric.value = { ...metric };
  showAddModal.value = true;
};

const closeModal = () => {
  showAddModal.value = false;
  editingMetric.value = null;
};

const saveMetric = () => {
  // TODO: Implement API call to save metric
  console.log('Saving metric:', editingMetric.value);
  closeModal();
};

// Initialize
onMounted(() => {
  fetchMetrics();
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
            placeholder="搜索业务指标..."
            v-model="searchQuery"
            class="w-full bg-gray-800 border border-gray-700 rounded-lg py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 pl-10"
          />
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" />
            </svg>
          </div>
        </div>
      </div>
      
      <div class="flex gap-4">
        <select
          v-model="selectedCategory"
          class="bg-gray-800 border border-gray-700 rounded-lg py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">所有类型</option>
          <option value="user">用户指标</option>
          <option value="performance">性能指标</option>
          <option value="business">业务指标</option>
          <option value="quality">质量指标</option>
          <option value="custom">自定义指标</option>
        </select>
        
        <button
          @click="openAddModal"
          class="bg-blue-600 hover:bg-blue-500 text-white rounded-lg px-4 py-2 flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
          </svg>
          添加业务指标
        </button>
      </div>
    </div>
    
    <!-- Metrics Table -->
    <div class="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-700">
          <thead class="bg-gray-700">
            <tr>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                指标名称
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                类别
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                数据源
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                查询表达式
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                状态
              </th>
              <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody v-if="!loading" class="bg-gray-800 divide-y divide-gray-700">
            <tr v-for="metric in filteredMetrics" :key="metric.id" class="hover:bg-gray-750">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-start flex-col">
                  <div class="text-sm font-medium text-white">{{ metric.name }}</div>
                  <div class="text-xs text-gray-400 mt-1">{{ metric.description }}</div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 py-1 text-xs rounded-full text-white" :class="getCategoryColor(metric.category)">
                  {{ getCategoryLabel(metric.category) }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-300">{{ metric.dataSource }}</div>
              </td>
              <td class="px-6 py-4">
                <div class="text-sm text-gray-300 font-mono truncate max-w-xs">{{ metric.query }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 py-1 text-xs rounded-full text-white" :class="getStatusColor(metric.status)">
                  {{ metric.status === 'active' ? '激活' : metric.status === 'draft' ? '草稿' : '停用' }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div class="flex justify-end space-x-2">
                  <button @click="openEditModal(metric)" class="text-blue-400 hover:text-blue-300">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                  </button>
                  <button class="text-green-400 hover:text-green-300">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V8z" clip-rule="evenodd" />
                    </svg>
                  </button>
                  <button class="text-red-400 hover:text-red-300">
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
              <td colspan="6" class="px-6 py-4 text-center text-white">
                <div class="flex justify-center items-center space-x-2">
                  <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>加载业务指标中...</span>
                </div>
              </td>
            </tr>
          </tbody>
          <tbody v-if="!loading && filteredMetrics.length === 0">
            <tr>
              <td colspan="6" class="px-6 py-10 text-center text-white">
                <div class="flex flex-col items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-gray-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <p class="text-gray-400 mb-2">未找到业务指标</p>
                  <button
                    @click="openAddModal"
                    class="mt-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg px-4 py-2 text-sm"
                  >
                    添加您的第一个业务指标
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <!-- Add/Edit Metric Modal -->
  <div v-if="showAddModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div class="bg-gray-800 rounded-lg w-full max-w-2xl overflow-hidden">
      <div class="px-6 py-4 border-b border-gray-700 flex justify-between items-center">
        <h3 class="text-xl font-medium text-white">{{ editingMetric ? '编辑业务指标' : '添加业务指标' }}</h3>
        <button @click="closeModal" class="text-gray-400 hover:text-white">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div class="p-6 space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">指标名称</label>
            <input
              type="text"
              v-model="editingMetric ? editingMetric.name : ''"
              class="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="例如: 用户活跃度"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">类别</label>
            <select
              v-model="editingMetric ? editingMetric.category : 'business'"
              class="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="user">用户指标</option>
              <option value="performance">性能指标</option>
              <option value="business">业务指标</option>
              <option value="quality">质量指标</option>
              <option value="custom">自定义指标</option>
            </select>
          </div>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-1">描述</label>
          <textarea
            v-model="editingMetric ? editingMetric.description : ''"
            class="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows="2"
            placeholder="指标的详细描述"
          ></textarea>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">数据源</label>
            <select
              v-model="editingMetric ? editingMetric.dataSource : ''"
              class="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Prometheus 1">Prometheus 1</option>
              <option value="Database 1">Database 1</option>
              <option value="Custom API">Custom API</option>
            </select>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">聚合方式</label>
            <select
              v-model="editingMetric ? editingMetric.aggregation : 'avg'"
              class="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="avg">平均值</option>
              <option value="sum">总和</option>
              <option value="min">最小值</option>
              <option value="max">最大值</option>
              <option value="count">计数</option>
            </select>
          </div>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-1">查询表达式</label>
          <textarea
            v-model="editingMetric ? editingMetric.query : ''"
            class="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            rows="3"
            placeholder="例如: sum(active_users)"
          ></textarea>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">单位</label>
            <input
              type="text"
              v-model="editingMetric ? editingMetric.unit : ''"
              class="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="例如: ms, %, 次/秒"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">警告阈值</label>
            <input
              type="number"
              v-model="editingMetric && editingMetric.thresholds ? editingMetric.thresholds.warning : ''"
              class="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="警告阈值"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">严重阈值</label>
            <input
              type="number"
              v-model="editingMetric && editingMetric.thresholds ? editingMetric.thresholds.critical : ''"
              class="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="严重阈值"
            />
          </div>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-1">状态</label>
          <div class="flex space-x-4 mt-1">
            <label class="inline-flex items-center">
              <input
                type="radio"
                v-model="editingMetric ? editingMetric.status : 'draft'"
                value="active"
                class="text-blue-600"
              />
              <span class="ml-2 text-white">激活</span>
            </label>
            <label class="inline-flex items-center">
              <input
                type="radio"
                v-model="editingMetric ? editingMetric.status : 'draft'"
                value="inactive"
                class="text-blue-600"
              />
              <span class="ml-2 text-white">停用</span>
            </label>
            <label class="inline-flex items-center">
              <input
                type="radio"
                v-model="editingMetric ? editingMetric.status : 'draft'"
                value="draft"
                class="text-blue-600"
              />
              <span class="ml-2 text-white">草稿</span>
            </label>
          </div>
        </div>
      </div>
      <div class="px-6 py-4 border-t border-gray-700 flex justify-end gap-3">
        <button @click="closeModal" class="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg">取消</button>
        <button @click="saveMetric" class="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg">保存</button>
      </div>
    </div>
  </div>
</template> 