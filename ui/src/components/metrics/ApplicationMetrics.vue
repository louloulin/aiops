<!-- ApplicationMetrics.vue -->
<template>
  <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
    <!-- Response Time Card -->
    <div class="rounded-lg border bg-card text-card-foreground shadow-sm">
      <div class="p-6">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-medium">Response Time</h3>
          <span class="text-sm text-muted-foreground">Avg: {{ formatTime(metrics.responseTime?.avg || 0) }}</span>
        </div>
        <div class="mt-4">
          <div class="text-3xl font-bold">{{ formatTime(metrics.responseTime?.p95 || 0) }}</div>
          <div class="text-sm text-muted-foreground">95th percentile</div>
          <div class="mt-2 flex items-center gap-2">
            <div class="text-xs">Min: {{ formatTime(metrics.responseTime?.min || 0) }}</div>
            <div class="text-xs">Max: {{ formatTime(metrics.responseTime?.max || 0) }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Error Rate Card -->
    <div class="rounded-lg border bg-card text-card-foreground shadow-sm">
      <div class="p-6">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-medium">Error Rate</h3>
          <span class="text-sm text-muted-foreground">Last 5m</span>
        </div>
        <div class="mt-4">
          <div class="text-3xl font-bold" :class="getErrorRateColor(metrics.errorRate || 0)">
            {{ formatNumber(metrics.errorRate || 0) }}%
          </div>
          <div class="mt-2 flex items-center gap-2">
            <div class="text-xs">Total Errors: {{ metrics.totalErrors || 0 }}</div>
            <div class="text-xs">Total Requests: {{ metrics.totalRequests || 0 }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Request Rate Card -->
    <div class="rounded-lg border bg-card text-card-foreground shadow-sm">
      <div class="p-6">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-medium">Request Rate</h3>
          <span class="text-sm text-muted-foreground">per second</span>
        </div>
        <div class="mt-4">
          <div class="text-3xl font-bold">{{ formatNumber(metrics.requestRate || 0) }}</div>
          <div class="mt-2 flex items-center gap-2">
            <div class="text-xs">Peak: {{ formatNumber(metrics.peakRequestRate || 0) }}/s</div>
            <div class="text-xs">Total: {{ metrics.totalRequests || 0 }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

interface ApplicationMetrics {
  responseTime?: {
    avg: number;
    min: number;
    max: number;
    p95: number;
  };
  errorRate?: number;
  totalErrors?: number;
  totalRequests?: number;
  requestRate?: number;
  peakRequestRate?: number;
}

const metrics = ref<ApplicationMetrics>({});
const loading = ref(false);
const error = ref<string | null>(null);

// API基础URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:9700/api';

const formatNumber = (num: number): string => {
  return num.toFixed(2);
};

const formatTime = (ms: number): string => {
  if (ms < 1) return `${(ms * 1000).toFixed(2)}μs`;
  if (ms < 1000) return `${ms.toFixed(2)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
};

const getErrorRateColor = (rate: number): string => {
  if (rate >= 5) return 'text-red-500';
  if (rate >= 1) return 'text-yellow-500';
  return 'text-green-500';
};

const fetchMetrics = async () => {
  loading.value = true;
  error.value = null;
  
  try {
    const response = await fetch(`${API_BASE_URL}/metrics/application`);
    
    if (!response.ok) {
      throw new Error(`API错误: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.success && data.data) {
      metrics.value = data.data;
    } else {
      throw new Error('获取应用指标数据失败');
    }
  } catch (err) {
    console.error('Failed to fetch application metrics:', err);
    error.value = err instanceof Error ? err.message : '未知错误';
    
    // 开发环境下使用模拟数据
    if (import.meta.env.DEV) {
      metrics.value = generateMockMetrics();
    }
  } finally {
    loading.value = false;
  }
};

// 生成模拟数据（仅开发环境使用）
const generateMockMetrics = (): ApplicationMetrics => {
  const totalRequests = Math.round(Math.random() * 10000 + 5000);
  const totalErrors = Math.round(Math.random() * 100);
  
  return {
    responseTime: {
      avg: Math.random() * 100 + 50,
      min: Math.random() * 20 + 10,
      max: Math.random() * 500 + 200,
      p95: Math.random() * 200 + 100
    },
    errorRate: (totalErrors / totalRequests) * 100,
    totalErrors,
    totalRequests,
    requestRate: Math.random() * 50 + 20,
    peakRequestRate: Math.random() * 100 + 50
  };
};

onMounted(() => {
  fetchMetrics();
  // Update metrics every 10 seconds
  setInterval(fetchMetrics, 10000);
});
</script> 