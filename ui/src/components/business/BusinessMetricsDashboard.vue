<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';

interface BusinessMetricData {
  id: string;
  name: string;
  description: string;
  category: 'user' | 'performance' | 'business' | 'quality' | 'custom';
  value: number;
  unit: string;
  status: 'normal' | 'warning' | 'critical';
  trend: number[];
  timestamp: Date;
  change: number; // 变化百分比
}

// State
const metrics = ref<BusinessMetricData[]>([]);
const loading = ref(true);
const selectedCategory = ref<string>('all');
const searchQuery = ref('');
const timeRange = ref<'1h' | '24h' | '7d' | '30d'>('24h');

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

const groupedByCategory = computed(() => {
  const result: Record<string, BusinessMetricData[]> = {
    user: [],
    performance: [],
    business: [],
    quality: [],
    custom: []
  };
  
  filteredMetrics.value.forEach(metric => {
    if (result[metric.category]) {
      result[metric.category].push(metric);
    }
  });
  
  return result;
});

const categoriesWithData = computed(() => {
  return Object.entries(groupedByCategory.value)
    .filter(([_, metrics]) => metrics.length > 0)
    .map(([category]) => category);
});

// Methods
const fetchMetrics = async () => {
  try {
    loading.value = true;
    const response = await fetch(`${API_BASE_URL}/business/metrics/data?timeRange=${timeRange.value}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch business metrics data');
    }

    const data = await response.json();
    if (data.success) {
      metrics.value = data.metrics;
    }
  } catch (error) {
    console.error('Error fetching business metrics data:', error);
    if (import.meta.env.DEV) {
      generateMockData();
    }
  } finally {
    loading.value = false;
  }
};

const generateMockData = () => {
  const categories = ['user', 'performance', 'business', 'quality', 'custom'] as const;
  const statuses = ['normal', 'warning', 'critical'] as const;
  const units = ['ms', 'req/s', '%', 'count', 'MB', 'users'];
  
  const metricTemplates = [
    { name: '用户活跃度', category: 'user' as const, unit: 'users' },
    { name: '接口响应时间', category: 'performance' as const, unit: 'ms' },
    { name: '订单成功率', category: 'business' as const, unit: '%' },
    { name: '服务可用性', category: 'quality' as const, unit: '%' },
    { name: '并发用户数', category: 'user' as const, unit: 'users' },
    { name: '每分钟请求数', category: 'performance' as const, unit: 'req/s' },
    { name: '销售转化率', category: 'business' as const, unit: '%' },
    { name: '错误率', category: 'quality' as const, unit: '%' },
    { name: '平均会话时长', category: 'user' as const, unit: 's' },
    { name: '缓存命中率', category: 'performance' as const, unit: '%' },
    { name: '用户满意度', category: 'business' as const, unit: 'score' },
    { name: '页面加载时间', category: 'performance' as const, unit: 'ms' }
  ];
  
  metrics.value = metricTemplates.map((template, i) => {
    const value = Math.round(Math.random() * 1000 * 100) / 100;
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const trend = Array.from({ length: 24 }, () => Math.round(Math.random() * 1000));
    const change = Math.round((Math.random() * 40 - 20) * 100) / 100; // -20% to +20%
    
    return {
      id: `bmdata-${i + 1}`,
      name: template.name,
      description: `${template.name}的监控指标，用于衡量系统的${template.category}表现`,
      category: template.category,
      value,
      unit: template.unit,
      status,
      trend,
      timestamp: new Date(Date.now() - Math.random() * 60 * 60 * 1000),
      change
    };
  });
};

const formatValue = (value: number, unit: string) => {
  return `${value.toLocaleString()} ${unit}`;
};

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    normal: 'bg-green-500',
    warning: 'bg-yellow-500',
    critical: 'bg-red-500'
  };
  return colors[status] || 'bg-gray-500';
};

const getStatusTextColor = (status: string) => {
  const colors: Record<string, string> = {
    normal: 'text-green-500',
    warning: 'text-yellow-500',
    critical: 'text-red-500'
  };
  return colors[status] || 'text-gray-500';
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

const formatTimestamp = (date: Date) => {
  return new Date(date).toLocaleString();
};

const getChangeClass = (change: number) => {
  return change > 0 ? 'text-green-500' : change < 0 ? 'text-red-500' : 'text-gray-400';
};

const formatChange = (change: number) => {
  const prefix = change > 0 ? '+' : '';
  return `${prefix}${change}%`;
};

// Initialize
onMounted(() => {
  fetchMetrics();
  // Refresh every minute
  setInterval(fetchMetrics, 60000);
});
</script>

<template>
  <div class="space-y-6">
    <!-- Controls -->
    <div class="flex flex-col md:flex-row justify-between gap-4">
      <div class="flex flex-wrap gap-4 items-center">
        <div>
          <label for="category-select" class="block text-sm font-medium text-gray-400 mb-1">分类</label>
          <select
            id="category-select"
            v-model="selectedCategory"
            class="bg-gray-800 border border-gray-700 rounded-lg py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">所有指标</option>
            <option value="user">用户指标</option>
            <option value="performance">性能指标</option>
            <option value="business">业务指标</option>
            <option value="quality">质量指标</option>
            <option value="custom">自定义指标</option>
          </select>
        </div>
        
        <div>
          <label for="time-range" class="block text-sm font-medium text-gray-400 mb-1">时间范围</label>
          <select
            id="time-range"
            v-model="timeRange"
            class="bg-gray-800 border border-gray-700 rounded-lg py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="1h">最近1小时</option>
            <option value="24h">最近24小时</option>
            <option value="7d">最近7天</option>
            <option value="30d">最近30天</option>
          </select>
        </div>
      </div>
      
      <div class="flex-1 max-w-md">
        <label for="search-metrics" class="block text-sm font-medium text-gray-400 mb-1">搜索</label>
        <div class="relative w-full">
          <input
            id="search-metrics"
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
    </div>
    
    <!-- Summary Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="bg-gray-800 border border-gray-700 rounded-lg p-4">
        <div class="flex justify-between items-start">
          <div>
            <p class="text-sm text-gray-400">异常指标</p>
            <p class="text-2xl font-semibold text-white mt-1">
              {{ metrics.filter(m => m.status !== 'normal').length }}
            </p>
          </div>
          <div class="p-2 bg-gray-700 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        </div>
        <div class="mt-4 flex items-center text-sm">
          <span class="text-yellow-500">{{ metrics.filter(m => m.status === 'warning').length }} 警告</span>
          <span class="mx-2 text-gray-600">•</span>
          <span class="text-red-500">{{ metrics.filter(m => m.status === 'critical').length }} 严重</span>
        </div>
      </div>
      
      <div class="bg-gray-800 border border-gray-700 rounded-lg p-4">
        <div class="flex justify-between items-start">
          <div>
            <p class="text-sm text-gray-400">性能指标</p>
            <p class="text-2xl font-semibold text-white mt-1">
              {{ metrics.filter(m => m.category === 'performance').length }}
            </p>
          </div>
          <div class="p-2 bg-gray-700 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
        </div>
        <div class="mt-4 flex items-center text-sm">
          <span :class="getStatusTextColor('normal')">{{ metrics.filter(m => m.category === 'performance' && m.status === 'normal').length }} 正常</span>
          <span class="mx-2 text-gray-600">•</span>
          <span :class="getStatusTextColor('warning')">{{ metrics.filter(m => m.category === 'performance' && m.status !== 'normal').length }} 异常</span>
        </div>
      </div>
      
      <div class="bg-gray-800 border border-gray-700 rounded-lg p-4">
        <div class="flex justify-between items-start">
          <div>
            <p class="text-sm text-gray-400">业务指标</p>
            <p class="text-2xl font-semibold text-white mt-1">
              {{ metrics.filter(m => m.category === 'business').length }}
            </p>
          </div>
          <div class="p-2 bg-gray-700 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <div class="mt-4 flex items-center text-sm">
          <span :class="getStatusTextColor('normal')">{{ metrics.filter(m => m.category === 'business' && m.status === 'normal').length }} 正常</span>
          <span class="mx-2 text-gray-600">•</span>
          <span :class="getStatusTextColor('warning')">{{ metrics.filter(m => m.category === 'business' && m.status !== 'normal').length }} 异常</span>
        </div>
      </div>
      
      <div class="bg-gray-800 border border-gray-700 rounded-lg p-4">
        <div class="flex justify-between items-start">
          <div>
            <p class="text-sm text-gray-400">用户指标</p>
            <p class="text-2xl font-semibold text-white mt-1">
              {{ metrics.filter(m => m.category === 'user').length }}
            </p>
          </div>
          <div class="p-2 bg-gray-700 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        </div>
        <div class="mt-4 flex items-center text-sm">
          <span :class="getStatusTextColor('normal')">{{ metrics.filter(m => m.category === 'user' && m.status === 'normal').length }} 正常</span>
          <span class="mx-2 text-gray-600">•</span>
          <span :class="getStatusTextColor('warning')">{{ metrics.filter(m => m.category === 'user' && m.status !== 'normal').length }} 异常</span>
        </div>
      </div>
    </div>
    
    <!-- Metrics Cards -->
    <div v-if="!loading">
      <div v-for="category in categoriesWithData" :key="category" class="mb-8">
        <h3 class="text-lg font-semibold text-white mb-4">{{ getCategoryLabel(category) }}</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="metric in groupedByCategory[category]"
            :key="metric.id"
            class="bg-gray-800 border border-gray-700 rounded-lg p-4"
          >
            <div class="flex justify-between items-start">
              <div>
                <h4 class="text-md font-medium text-white">{{ metric.name }}</h4>
                <p class="text-xs text-gray-400 mt-1">{{ metric.description }}</p>
              </div>
              <span
                class="px-2 py-1 text-xs rounded-full text-white"
                :class="getStatusColor(metric.status)"
              >
                {{ metric.status === 'normal' ? '正常' : metric.status === 'warning' ? '警告' : '严重' }}
              </span>
            </div>
            
            <div class="mt-4 flex items-end space-x-1 h-10">
              <div
                v-for="(value, index) in metric.trend"
                :key="index"
                class="w-full bg-blue-500 rounded-sm"
                :style="{ 
                  height: `${(value / Math.max(...metric.trend)) * 100}%`,
                  opacity: 0.3 + (0.7 * (index / metric.trend.length))
                }"
              ></div>
            </div>
            
            <div class="mt-4 flex justify-between items-center">
              <div>
                <p class="text-2xl font-semibold text-white">{{ formatValue(metric.value, metric.unit) }}</p>
                <div class="flex items-center mt-1">
                  <span :class="getChangeClass(metric.change)">
                    {{ formatChange(metric.change) }}
                  </span>
                  <svg
                    v-if="metric.change !== 0"
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-3 w-3 ml-1"
                    :class="getChangeClass(metric.change)"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      v-if="metric.change > 0"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M5 15l7-7 7 7"
                    />
                    <path
                      v-else
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
              <p class="text-xs text-gray-400">
                {{ formatTimestamp(metric.timestamp) }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      <p class="ml-3 text-gray-400">加载业务指标...</p>
    </div>
    
    <!-- No Results -->
    <div v-if="!loading && filteredMetrics.length === 0" class="bg-gray-800 border border-gray-700 rounded-lg p-8 text-center">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-gray-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
      <p class="text-gray-400 text-lg mb-2">未找到业务指标</p>
      <p class="text-gray-500">尝试调整过滤条件或添加新的业务指标</p>
    </div>
  </div>
</template> 