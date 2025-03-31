<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { businessMetricsApi } from '@/services/api';

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
  // 这是本地状态，用于存储最新的指标值
  currentValue?: number;
  metricStatus?: 'normal' | 'warning' | 'critical';
}

const router = useRouter();
const metrics = ref<BusinessMetric[]>([]);
const loading = ref(true);
const metricData = ref<Record<number, number>>({});

// 统计数量
const warningCount = computed(() => 
  metrics.value.filter(m => m.metricStatus === 'warning').length
);

const criticalCount = computed(() => 
  metrics.value.filter(m => m.metricStatus === 'critical').length
);

const normalCount = computed(() => 
  metrics.value.filter(m => m.metricStatus === 'normal').length
);

// 获取指标列表
const fetchMetrics = async () => {
  try {
    loading.value = true;
    const response = await businessMetricsApi.getMetrics();
    
    if (response.success) {
      metrics.value = response.metrics;
      
      // 获取每个指标的数据
      for (const metric of metrics.value) {
        await fetchMetricData(metric);
      }
    } else {
      alert(response.message || '获取业务指标失败');
    }
  } catch (error) {
    console.error('获取业务指标失败:', error);
    if (import.meta.env.DEV) {
      generateMockData();
    }
  } finally {
    loading.value = false;
  }
};

// 获取单个指标的数据
const fetchMetricData = async (metric: BusinessMetric) => {
  try {
    const response = await businessMetricsApi.getMetricData(metric.id, '24h');
    
    if (response.success && response.data.length > 0) {
      // 获取最新的数据点
      const latestDataPoint = response.data.sort((a: { timestamp: string }, b: { timestamp: string }) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )[0];
      
      metric.currentValue = latestDataPoint.value;
      
      // 设置指标状态
      if (metric.criticalThreshold !== null && metric.currentValue !== undefined && metric.currentValue >= metric.criticalThreshold) {
        metric.metricStatus = 'critical';
      } else if (metric.warningThreshold !== null && metric.currentValue !== undefined && metric.currentValue >= metric.warningThreshold) {
        metric.metricStatus = 'warning';
      } else {
        metric.metricStatus = 'normal';
      }
    }
  } catch (error) {
    console.error(`获取指标 ${metric.id} 数据失败:`, error);
    // 为开发环境生成模拟数据
    if (import.meta.env.DEV) {
      generateMockMetricData(metric);
    }
  }
};

// 生成模拟数据
const generateMockData = () => {
  metrics.value = [
    {
      id: 1,
      name: '用户活跃度',
      description: '每日活跃用户数',
      category: 'user',
      query: 'count(distinct user_id)',
      dataSource: 'Prometheus 1',
      warningThreshold: 1000,
      criticalThreshold: 500,
      unit: '人',
      aggregation: 'count',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'active',
      currentValue: 1200,
      metricStatus: 'normal'
    },
    {
      id: 2,
      name: '接口响应时间',
      description: 'API平均响应时间',
      category: 'performance',
      query: 'avg(response_time)',
      dataSource: 'Prometheus 1',
      warningThreshold: 200,
      criticalThreshold: 500,
      unit: 'ms',
      aggregation: 'avg',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'active',
      currentValue: 350,
      metricStatus: 'warning'
    },
    {
      id: 3,
      name: '订单转化率',
      description: '访问到下单的转化比例',
      category: 'business',
      query: 'orders / visits * 100',
      dataSource: 'Database 1',
      warningThreshold: 3,
      criticalThreshold: 1,
      unit: '%',
      aggregation: 'avg',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'active',
      currentValue: 0.8,
      metricStatus: 'critical'
    },
    {
      id: 4,
      name: '系统错误率',
      description: '系统错误占总请求的比例',
      category: 'quality',
      query: 'errors / requests * 100',
      dataSource: 'Prometheus 1',
      warningThreshold: 1,
      criticalThreshold: 5,
      unit: '%',
      aggregation: 'avg',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'active',
      currentValue: 2.5,
      metricStatus: 'warning'
    }
  ];
};

// 为单个指标生成模拟数据
const generateMockMetricData = (metric: BusinessMetric) => {
  if (metric.warningThreshold === null || metric.criticalThreshold === null) {
    metric.currentValue = Math.floor(Math.random() * 100);
    metric.metricStatus = 'normal';
    return;
  }
  
  // 随机生成一个状态，有30%概率是警告，10%概率是严重
  const random = Math.random();
  
  if (random < 0.1) {
    // 严重状态
    metric.metricStatus = 'critical';
    metric.currentValue = metric.criticalThreshold + Math.random() * 20;
  } else if (random < 0.3) {
    // 警告状态
    metric.metricStatus = 'warning';
    const range = metric.criticalThreshold - metric.warningThreshold;
    metric.currentValue = metric.warningThreshold + Math.random() * (range > 0 ? range : 10);
  } else {
    // 正常状态
    metric.metricStatus = 'normal';
    const max = metric.warningThreshold > 0 ? metric.warningThreshold * 0.8 : 100;
    metric.currentValue = Math.random() * max;
  }
};

// 获取进度条颜色
const getProgressBarColor = (metric: BusinessMetric) => {
  if (!metric.metricStatus) return 'bg-green-500';
  
  if (metric.metricStatus === 'critical') {
    return 'bg-red-500';
  } else if (metric.metricStatus === 'warning') {
    return 'bg-yellow-500';
  } else {
    return 'bg-green-500';
  }
};

// 获取进度条宽度
const getProgressBarWidth = (metric: BusinessMetric) => {
  if (metric.currentValue === undefined) return '0%';
  
  // 根据是否有阈值不同计算方式
  if (metric.criticalThreshold !== null) {
    // 超过严重阈值则100%
    if (metric.currentValue >= metric.criticalThreshold) {
      return '100%';
    }
    
    // 使用当前值与严重阈值的比例
    return `${Math.min(100, (metric.currentValue / metric.criticalThreshold) * 100)}%`;
  } else if (metric.warningThreshold !== null) {
    // 超过警告阈值则100%
    if (metric.currentValue >= metric.warningThreshold) {
      return '100%';
    }
    
    // 使用当前值与警告阈值的比例
    return `${Math.min(100, (metric.currentValue / metric.warningThreshold) * 100)}%`;
  } else {
    // 没有阈值，直接用当前值的百分比（假设最大100）
    return `${Math.min(100, metric.currentValue)}%`;
  }
};

// 获取指标当前值
const getMetricValue = (metric: BusinessMetric) => {
  if (metric.currentValue === undefined) return 'N/A';
  return metric.currentValue.toFixed(2);
};

// 获取指标值颜色
const getMetricStatusColor = (metric: BusinessMetric) => {
  if (!metric.metricStatus) return 'text-white';
  
  if (metric.metricStatus === 'critical') {
    return 'text-red-500';
  } else if (metric.metricStatus === 'warning') {
    return 'text-yellow-500';
  } else {
    return 'text-green-500';
  }
};

// 类型标签
const getCategoryLabel = (category: string) => {
  const labels: Record<string, string> = {
    user: '用户',
    performance: '性能',
    business: '业务',
    quality: '质量',
    custom: '自定义'
  };
  return labels[category] || category;
};

// 类型颜色
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

// 状态颜色
const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    active: 'bg-green-500',
    inactive: 'bg-gray-500',
    draft: 'bg-yellow-500'
  };
  return colors[status] || 'bg-gray-500';
};

// 查看指标详情
const viewMetricDetails = (metric: BusinessMetric) => {
  router.push(`/business-metrics/${metric.id}`);
};

// 页面加载时获取数据
onMounted(() => {
  fetchMetrics();
});
</script>

<template>
  <div class="space-y-6">
    <!-- 加载状态 -->
    <div v-if="loading" class="flex justify-center items-center h-64">
      <div class="flex flex-col items-center">
        <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
        <p class="mt-4 text-gray-400">加载指标数据中...</p>
      </div>
    </div>

    <div v-else>
      <!-- 摘要卡片 -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div class="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-400">业务指标总数</p>
              <p class="text-2xl font-bold text-white mt-1">{{ metrics.length }}</p>
            </div>
            <div class="bg-blue-500 bg-opacity-10 p-3 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>

        <div class="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-400">触发警告阈值</p>
              <p class="text-2xl font-bold text-yellow-500 mt-1">{{ warningCount }}</p>
            </div>
            <div class="bg-yellow-500 bg-opacity-10 p-3 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
        </div>

        <div class="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-400">触发严重阈值</p>
              <p class="text-2xl font-bold text-red-500 mt-1">{{ criticalCount }}</p>
            </div>
            <div class="bg-red-500 bg-opacity-10 p-3 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div class="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-400">正常指标</p>
              <p class="text-2xl font-bold text-green-500 mt-1">{{ normalCount }}</p>
            </div>
            <div class="bg-green-500 bg-opacity-10 p-3 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- 指标卡片 -->
      <div class="mt-8 space-y-6">
        <h2 class="text-xl font-bold text-white">业务指标状态</h2>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div 
            v-for="metric in metrics" 
            :key="metric.id" 
            class="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden hover:border-blue-500 transition-all cursor-pointer"
            @click="viewMetricDetails(metric)"
          >
            <div class="px-4 py-3 border-b border-gray-700 flex justify-between items-center">
              <div class="flex items-center gap-2">
                <span class="px-2 py-1 text-xs rounded-full text-white" :class="getCategoryColor(metric.category)">
                  {{ getCategoryLabel(metric.category) }}
                </span>
                <h3 class="text-md font-medium text-white">{{ metric.name }}</h3>
              </div>
              <span class="px-2 py-1 text-xs rounded-full text-white" :class="getStatusColor(metric.status)">
                {{ metric.status === 'active' ? '激活' : metric.status === 'draft' ? '草稿' : '停用' }}
              </span>
            </div>
            
            <div class="p-4">
              <p class="text-sm text-gray-400 mb-4">{{ metric.description || '无描述' }}</p>
              
              <div class="flex justify-between items-center">
                <div>
                  <p class="text-xs text-gray-500">当前值</p>
                  <p class="text-xl font-bold" :class="getMetricStatusColor(metric)">
                    {{ getMetricValue(metric) }} {{ metric.unit || '' }}
                  </p>
                </div>
                
                <div class="flex gap-2">
                  <div v-if="metric.warningThreshold !== null" class="text-right">
                    <p class="text-xs text-gray-500">警告阈值</p>
                    <p class="text-sm text-yellow-500">{{ metric.warningThreshold }} {{ metric.unit || '' }}</p>
                  </div>
                  <div v-if="metric.criticalThreshold !== null" class="text-right">
                    <p class="text-xs text-gray-500">严重阈值</p>
                    <p class="text-sm text-red-500">{{ metric.criticalThreshold }} {{ metric.unit || '' }}</p>
                  </div>
                </div>
              </div>
              
              <div class="mt-4">
                <div class="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    class="h-2 rounded-full" 
                    :class="getProgressBarColor(metric)"
                    :style="{ width: getProgressBarWidth(metric) }"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template> 