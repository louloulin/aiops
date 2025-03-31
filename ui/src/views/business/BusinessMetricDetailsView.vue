<template>
  <div class="container mx-auto py-6 px-4">
    <div class="flex justify-between items-center mb-6">
      <div>
        <div class="flex items-center mb-2">
          <router-link to="/business-metrics" class="text-blue-500 hover:text-blue-400">
            <span class="material-icons-outlined text-sm">arrow_back</span>
            返回指标列表
          </router-link>
        </div>
        <h1 class="text-2xl font-bold text-white">{{ metric?.name || '加载中...' }}</h1>
        <p class="text-gray-400 mt-2">{{ metric?.description || '' }}</p>
      </div>
      
      <div class="flex gap-2">
        <router-link 
          to="/business-metrics-dashboard" 
          class="flex items-center px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition"
        >
          <span class="material-icons-outlined mr-1 text-sm">dashboard</span>
          仪表盘
        </router-link>
        
        <button 
          v-if="metric"
          @click="toggleEdit" 
          class="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <span class="material-icons-outlined mr-1 text-sm">{{ isEditing ? 'visibility' : 'edit' }}</span>
          {{ isEditing ? '查看详情' : '编辑指标' }}
        </button>
      </div>
    </div>
    
    <div v-if="loading" class="flex justify-center items-center h-64">
      <div class="flex flex-col items-center">
        <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
        <p class="mt-4 text-gray-400">加载指标数据中...</p>
      </div>
    </div>
    
    <div v-else>
      <!-- 编辑模式 -->
      <div v-if="isEditing && metric">
        <BusinessMetricDefinition 
          :editing-metric="metric" 
          @save="handleMetricSaved"
          @cancel="isEditing = false"
        />
      </div>
      
      <!-- 详情模式 -->
      <div v-else-if="metric">
        <BusinessMetricDetails :metric="metric" :key="metric.id" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { businessMetricsApi } from '@/services/api';
import BusinessMetricDefinition from '@/components/business/BusinessMetricDefinition.vue';
import BusinessMetricDetails from '@/components/business/BusinessMetricDetails.vue';

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

const route = useRoute();
const router = useRouter();
const metric = ref<BusinessMetric | null>(null);
const loading = ref(true);
const isEditing = ref(false);

// 加载指标数据
const loadMetric = async () => {
  try {
    loading.value = true;
    const id = route.params.id as string;
    
    if (!id) {
      router.push('/business-metrics');
      return;
    }
    
    const response = await businessMetricsApi.getMetric(Number(id));
    
    if (response.success) {
      metric.value = response.metric;
    } else {
      alert('加载指标详情失败: ' + response.message);
      router.push('/business-metrics');
    }
  } catch (error) {
    console.error('获取指标详情失败:', error);
    alert('获取指标详情失败');
    router.push('/business-metrics');
  } finally {
    loading.value = false;
  }
};

// 切换编辑模式
const toggleEdit = () => {
  isEditing.value = !isEditing.value;
};

// 处理指标保存
const handleMetricSaved = (updatedMetric: BusinessMetric) => {
  metric.value = updatedMetric;
  isEditing.value = false;
  loadMetric(); // 重新加载最新数据
};

// 页面加载时获取指标数据
onMounted(() => {
  loadMetric();
});
</script> 