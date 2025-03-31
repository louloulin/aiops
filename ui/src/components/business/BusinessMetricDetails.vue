<template>
  <div class="space-y-6">
    <!-- 加载状态 -->
    <div v-if="loading" class="flex justify-center items-center h-64">
      <div class="flex flex-col items-center">
        <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
        <p class="mt-4 text-gray-400">加载指标数据中...</p>
      </div>
    </div>

    <!-- 指标详情 -->
    <div v-else-if="metric">
      <!-- 头部信息 -->
      <div class="flex justify-between items-start mb-6">
        <div>
          <h1 class="text-2xl font-bold text-white flex items-center gap-2">
            {{ metric.name }}
            <span class="px-2 py-1 text-xs rounded-full text-white" :class="getCategoryColor(metric.category)">
              {{ getCategoryLabel(metric.category) }}
            </span>
          </h1>
          <p class="text-gray-400 mt-1">{{ metric.description }}</p>
        </div>
        <div class="flex gap-3">
          <button 
            @click="$router.push('/business-metrics')" 
            class="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd" />
            </svg>
            返回列表
          </button>
          <button 
            @click="editMetric" 
            class="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
            编辑指标
          </button>
        </div>
      </div>

      <!-- 时间范围选择 -->
      <div class="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-6">
        <div class="flex justify-between items-center">
          <h2 class="text-lg font-medium text-white">数据图表</h2>
          <div class="flex gap-2">
            <button 
              v-for="range in timeRanges" 
              :key="range.value"
              @click="changeTimeRange(range.value)"
              :class="[
                'px-3 py-1 text-sm rounded-lg',
                selectedTimeRange === range.value 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              ]"
            >
              {{ range.label }}
            </button>
          </div>
        </div>
      </div>

      <!-- 图表显示 -->
      <div class="bg-gray-800 border border-gray-700 rounded-lg p-4 h-96">
        <div v-if="chartLoading" class="flex justify-center items-center h-full">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
        <div v-else-if="!chartData.length" class="flex justify-center items-center h-full text-gray-400">
          暂无数据
        </div>
        <div v-else ref="chartContainer" class="h-full"></div>
      </div>

      <!-- 指标详细信息 -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
        <div class="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <h3 class="text-sm font-medium text-gray-400 mb-1">数据源</h3>
          <p class="text-white">{{ metric.dataSource }}</p>
        </div>
        <div class="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <h3 class="text-sm font-medium text-gray-400 mb-1">查询表达式</h3>
          <p class="text-white font-mono text-sm">{{ metric.query }}</p>
        </div>
        <div class="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <h3 class="text-sm font-medium text-gray-400 mb-1">聚合方法</h3>
          <p class="text-white">{{ getAggregationLabel(metric.aggregation) }}</p>
        </div>
        <div class="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <h3 class="text-sm font-medium text-gray-400 mb-1">单位</h3>
          <p class="text-white">{{ metric.unit || '无' }}</p>
        </div>
        <div class="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <h3 class="text-sm font-medium text-gray-400 mb-1">警告阈值</h3>
          <p class="text-yellow-400">{{ metric.warningThreshold !== null ? `${metric.warningThreshold} ${metric.unit || ''}` : '未设置' }}</p>
        </div>
        <div class="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <h3 class="text-sm font-medium text-gray-400 mb-1">严重阈值</h3>
          <p class="text-red-400">{{ metric.criticalThreshold !== null ? `${metric.criticalThreshold} ${metric.unit || ''}` : '未设置' }}</p>
        </div>
        <div class="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <h3 class="text-sm font-medium text-gray-400 mb-1">状态</h3>
          <p>
            <span class="px-2 py-1 text-xs rounded-full text-white" :class="getStatusColor(metric.status)">
              {{ metric.status === 'active' ? '激活' : metric.status === 'draft' ? '草稿' : '停用' }}
            </span>
          </p>
        </div>
        <div class="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <h3 class="text-sm font-medium text-gray-400 mb-1">创建时间</h3>
          <p class="text-white">{{ formatDate(metric.createdAt) }}</p>
        </div>
        <div class="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <h3 class="text-sm font-medium text-gray-400 mb-1">最后更新</h3>
          <p class="text-white">{{ formatDate(metric.updatedAt) }}</p>
        </div>
      </div>
    </div>

    <!-- 数据表格 -->
    <div v-if="metric && chartData.length" class="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden mt-6">
      <div class="px-6 py-4 border-b border-gray-700">
        <h2 class="text-lg font-medium text-white">历史数据</h2>
      </div>
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-700">
          <thead class="bg-gray-700">
            <tr>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                时间
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                值 ({{ metric.unit || '' }})
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                状态
              </th>
            </tr>
          </thead>
          <tbody class="bg-gray-800 divide-y divide-gray-700">
            <tr v-for="(point, index) in chartData.slice().reverse().slice(0, 10)" :key="index" class="hover:bg-gray-750">
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                {{ formatDate(point.timestamp) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-white font-mono">
                {{ point.value.toFixed(2) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span 
                  class="px-2 py-1 text-xs rounded-full text-white"
                  :class="getValueStatusColor(point.value)"
                >
                  {{ getValueStatus(point.value) }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { businessMetricsApi } from '@/services/api';
import * as echarts from 'echarts';

interface BusinessMetric {
  id: number;
  name: string;
  description: string | null;
  category: 'user' | 'performance' | 'business' | 'quality' | 'custom';
  query: string;
  dataSource: string;
  warningThreshold: number | null;
  criticalThreshold: number | null;
  unit: string | null;
  aggregation: 'avg' | 'sum' | 'min' | 'max' | 'count';
  createdAt: string;
  updatedAt: string;
  status: 'active' | 'inactive' | 'draft';
}

interface DataPoint {
  id: number;
  metricId: number;
  value: number;
  timestamp: string;
}

const route = useRoute();
const router = useRouter();
const metric = ref<BusinessMetric | null>(null);
const loading = ref(true);
const chartLoading = ref(false);
const chartData = ref<DataPoint[]>([]);
const chart = ref<echarts.ECharts | null>(null);
const chartContainer = ref<HTMLElement | null>(null);
const selectedTimeRange = ref('24h');

const timeRanges = [
  { label: '1小时', value: '1h' },
  { label: '6小时', value: '6h' },
  { label: '24小时', value: '24h' },
  { label: '7天', value: '7d' },
  { label: '30天', value: '30d' },
];

// 获取指标详情
const fetchMetricDetails = async () => {
  try {
    loading.value = true;
    const id = route.params.id as string;
    const response = await businessMetricsApi.getMetricById(parseInt(id));
    
    if (response.success) {
      metric.value = response.metric;
      fetchMetricData();
    } else {
      alert(response.message || '获取业务指标详情失败');
    }
  } catch (error) {
    console.error('获取业务指标详情失败:', error);
    alert('获取业务指标详情失败');
  } finally {
    loading.value = false;
  }
};

// 获取指标数据
const fetchMetricData = async () => {
  if (!metric.value) return;
  
  try {
    chartLoading.value = true;
    const response = await businessMetricsApi.getMetricData(metric.value.id, selectedTimeRange.value);
    
    if (response.success) {
      chartData.value = response.data;
      nextTick(() => {
        initChart();
      });
    } else {
      alert(response.message || '获取业务指标数据失败');
    }
  } catch (error) {
    console.error('获取业务指标数据失败:', error);
    alert('获取业务指标数据失败');
  } finally {
    chartLoading.value = false;
  }
};

// 切换时间范围
const changeTimeRange = (range: string) => {
  selectedTimeRange.value = range;
  fetchMetricData();
};

// 初始化图表
const initChart = () => {
  if (!chartContainer.value || !metric.value) return;
  
  // 销毁已有图表
  if (chart.value) {
    chart.value.dispose();
  }
  
  // 准备数据
  const data = chartData.value
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .map(point => {
      return [
        new Date(point.timestamp),
        point.value
      ];
    });

  // 创建图表实例
  chart.value = echarts.init(chartContainer.value);
  
  const metricName = metric.value.name;
  const metricUnit = metric.value.unit || '';
  
  // 配置项
  const option = {
    title: {
      show: false
    },
    tooltip: {
      trigger: 'axis',
      formatter: function(params: any) {
        const date = new Date(params[0].value[0]);
        const value = params[0].value[1];
        return `${date.toLocaleString()}<br/>
                ${metricName}: <strong>${value.toFixed(2)} ${metricUnit}</strong>`;
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'time',
      splitLine: {
        show: false
      },
      axisLine: {
        lineStyle: {
          color: '#6b7280'
        }
      },
      axisLabel: {
        color: '#9ca3af'
      }
    },
    yAxis: {
      type: 'value',
      name: metricUnit,
      nameTextStyle: {
        color: '#9ca3af'
      },
      splitLine: {
        lineStyle: {
          color: '#374151'
        }
      },
      axisLine: {
        lineStyle: {
          color: '#6b7280'
        }
      },
      axisLabel: {
        color: '#9ca3af'
      }
    },
    series: [
      {
        name: metricName,
        type: 'line',
        showSymbol: false,
        lineStyle: {
          width: 3
        },
        markLine: getMarkLines(),
        areaStyle: {
          opacity: 0.2
        },
        data: data
      }
    ],
    backgroundColor: 'transparent',
    textStyle: {
      color: '#e5e7eb'
    }
  };
  
  // 设置图表
  chart.value.setOption(option);
  
  // 响应式调整图表大小
  window.addEventListener('resize', () => {
    chart.value?.resize();
  });
};

// 获取标记线
const getMarkLines = () => {
  const markLines: any = {
    silent: true,
    data: []
  };
  
  if (metric.value?.warningThreshold !== null) {
    markLines.data.push({
      name: '警告阈值',
      yAxis: metric.value.warningThreshold,
      lineStyle: {
        color: '#d97706',
        type: 'dashed'
      },
      label: {
        formatter: '警告: {c}',
        position: 'insideEndTop',
        color: '#d97706'
      }
    });
  }
  
  if (metric.value?.criticalThreshold !== null) {
    markLines.data.push({
      name: '严重阈值',
      yAxis: metric.value.criticalThreshold,
      lineStyle: {
        color: '#dc2626',
        type: 'dashed'
      },
      label: {
        formatter: '严重: {c}',
        position: 'insideEndTop',
        color: '#dc2626'
      }
    });
  }
  
  return markLines;
};

// 编辑指标
const editMetric = () => {
  if (metric.value) {
    router.push(`/business-metrics/edit/${metric.value.id}`);
  }
};

// 工具函数
const formatDate = (date: string) => {
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

const getAggregationLabel = (aggregation: string) => {
  const labels: Record<string, string> = {
    avg: '平均值',
    sum: '总和',
    min: '最小值',
    max: '最大值',
    count: '计数'
  };
  return labels[aggregation] || aggregation;
};

const getValueStatus = (value: number) => {
  if (!metric.value) return '正常';
  
  if (metric.value.criticalThreshold !== null && value >= metric.value.criticalThreshold) {
    return '严重';
  }
  
  if (metric.value.warningThreshold !== null && value >= metric.value.warningThreshold) {
    return '警告';
  }
  
  return '正常';
};

const getValueStatusColor = (value: number) => {
  if (!metric.value) return 'bg-green-500';
  
  if (metric.value.criticalThreshold !== null && value >= metric.value.criticalThreshold) {
    return 'bg-red-500';
  }
  
  if (metric.value.warningThreshold !== null && value >= metric.value.warningThreshold) {
    return 'bg-yellow-500';
  }
  
  return 'bg-green-500';
};

// 监听路由变化
watch(() => route.params.id, () => {
  fetchMetricDetails();
});

// 页面加载时获取数据
onMounted(() => {
  fetchMetricDetails();
});
</script> 