<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { API_BASE_URL } from '../config';

// 状态
const loading = ref(false);
const alerts = ref<any[]>([]);
const refreshInterval = ref<number | null>(null);
const filters = ref({
  severity: '',
  source: '',
  metric: ''
});

// 获取告警数据
const fetchAlerts = async () => {
  loading.value = true;
  try {
    const response = await fetch(`${API_BASE_URL}/alerts`);
    const data = await response.json();
    
    if (data.success) {
      alerts.value = data.alerts;
    } else {
      console.error('获取告警数据失败:', data.error);
    }
  } catch (error) {
    console.error('获取告警数据错误:', error);
  } finally {
    loading.value = false;
  }
};

// 检查告警
const checkAlerts = async () => {
  loading.value = true;
  try {
    const response = await fetch(`${API_BASE_URL}/alerts/check`, {
      method: 'POST'
    });
    const data = await response.json();
    
    if (data.success) {
      console.log(`检查完成，发现 ${data.alertsGenerated} 个新告警`);
      // 重新获取告警列表
      fetchAlerts();
    } else {
      console.error('检查告警失败:', data.error);
    }
  } catch (error) {
    console.error('检查告警错误:', error);
  } finally {
    loading.value = false;
  }
};

// 清除所有告警
const clearAlerts = async () => {
  if (!confirm('确定要清除所有告警吗？')) return;
  
  loading.value = true;
  try {
    const response = await fetch(`${API_BASE_URL}/alerts`, {
      method: 'DELETE'
    });
    const data = await response.json();
    
    if (data.success) {
      alerts.value = [];
      console.log('已清除所有告警');
    } else {
      console.error('清除告警失败:', data.error);
    }
  } catch (error) {
    console.error('清除告警错误:', error);
  } finally {
    loading.value = false;
  }
};

// 创建测试告警
const createTestAlert = async () => {
  loading.value = true;
  try {
    const response = await fetch(`${API_BASE_URL}/alerts/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        severity: 'warning',
        source: 'test',
        metric: 'test_metric',
        value: 95,
        threshold: 90,
        message: '这是一个测试告警'
      })
    });
    const data = await response.json();
    
    if (data.success) {
      console.log('已创建测试告警');
      // 重新获取告警列表
      fetchAlerts();
    } else {
      console.error('创建测试告警失败:', data.error);
    }
  } catch (error) {
    console.error('创建测试告警错误:', error);
  } finally {
    loading.value = false;
  }
};

// 过滤告警
const filteredAlerts = computed(() => {
  return alerts.value.filter(alert => {
    // 按严重性过滤
    if (filters.value.severity && alert.severity !== filters.value.severity) {
      return false;
    }
    
    // 按来源过滤
    if (filters.value.source && alert.source !== filters.value.source) {
      return false;
    }
    
    return true;
  });
});

// 重置过滤器
const resetFilters = () => {
  filters.value = {
    severity: '',
    source: '',
    metric: ''
  };
};

// 获取告警级别样式类
const getSeverityBadgeClass = (severity: string) => {
  switch (severity) {
    case 'critical':
      return 'bg-red-100 text-red-800';
    case 'warning':
      return 'bg-yellow-100 text-yellow-800';
    case 'info':
      return 'bg-blue-100 text-blue-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

// 获取告警级别文本
const getSeverityText = (severity: string) => {
  switch (severity) {
    case 'critical':
      return '严重';
    case 'warning':
      return '警告';
    case 'info':
      return '信息';
    default:
      return severity;
  }
};

// 获取行样式
const getSeverityRowClass = (severity: string) => {
  switch (severity) {
    case 'critical':
      return 'bg-red-50';
    case 'warning':
      return 'bg-yellow-50';
    default:
      return '';
  }
};

// 判断是否为百分比指标
const isPercentageMetric = (metric: string) => {
  return metric.includes('usage');
};

// 格式化百分比
const formatPercentage = (value: number) => {
  return `${value.toFixed(1)}%`;
};

// 格式化日期时间
const formatDateTime = (dateStr: string | Date) => {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).format(date);
};

// 自动刷新
const startAutoRefresh = () => {
  refreshInterval.value = window.setInterval(() => {
    fetchAlerts();
  }, 30000); // 每30秒刷新一次
};

// 生命周期钩子
onMounted(() => {
  fetchAlerts();
  startAutoRefresh();
});

onUnmounted(() => {
  if (refreshInterval.value !== null) {
    clearInterval(refreshInterval.value);
  }
});
</script>

<template>
  <div class="container mx-auto px-4 py-8">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">系统告警管理</h1>
      <div class="flex gap-2">
        <button 
          class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center gap-2"
          @click="checkAlerts" 
          :disabled="loading">
          <span v-if="loading" class="animate-spin">⟳</span>
          <span>检查告警</span>
        </button>
        <button 
          class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          @click="clearAlerts" 
          :disabled="loading">
          清除所有告警
        </button>
        <button 
          class="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          @click="createTestAlert" 
          :disabled="loading">
          创建测试告警
        </button>
      </div>
    </div>

    <!-- 过滤器 -->
    <div class="bg-white rounded-lg shadow p-4 mb-6">
      <h2 class="text-lg font-semibold mb-3">过滤条件</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">告警级别</label>
          <select v-model="filters.severity" class="w-full rounded border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
            <option value="">全部级别</option>
            <option value="info">信息</option>
            <option value="warning">警告</option>
            <option value="critical">严重</option>
          </select>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">告警来源</label>
          <select v-model="filters.source" class="w-full rounded border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
            <option value="">全部来源</option>
            <option value="cpu">CPU</option>
            <option value="memory">内存</option>
            <option value="disk">磁盘</option>
            <option value="network">网络</option>
          </select>
        </div>
        
        <div class="flex items-end">
          <button 
            class="px-4 py-2 bg-gray-100 text-gray-800 rounded hover:bg-gray-200"
            @click="resetFilters">
            重置过滤器
          </button>
        </div>
      </div>
    </div>

    <!-- 告警列表 -->
    <div class="bg-white rounded-lg shadow">
      <div class="p-4 border-b border-gray-200">
        <h2 class="text-lg font-semibold">当前告警 ({{ filteredAlerts.length }})</h2>
      </div>
      
      <div v-if="loading" class="flex justify-center items-center p-8">
        <div class="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
      </div>
      
      <div v-else-if="filteredAlerts.length === 0" class="p-8 text-center text-gray-500">
        没有匹配的告警信息
      </div>
      
      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">时间</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">级别</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">来源</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">指标</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">当前值</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">阈值</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">消息</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="alert in filteredAlerts" :key="alert.id" :class="getSeverityRowClass(alert.severity)">
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ formatDateTime(alert.timestamp) }}</td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span :class="getSeverityBadgeClass(alert.severity)" class="px-2 py-1 text-xs rounded-full">
                  {{ getSeverityText(alert.severity) }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">{{ alert.source }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ alert.metric }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ isPercentageMetric(alert.metric) ? formatPercentage(alert.value) : alert.value }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ isPercentageMetric(alert.metric) ? formatPercentage(alert.threshold) : alert.threshold }}
              </td>
              <td class="px-6 py-4 text-sm text-gray-900">{{ alert.message }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template> 