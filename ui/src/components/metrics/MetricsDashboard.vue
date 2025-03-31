<!-- MetricsDashboard.vue -->
<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h2 class="text-2xl font-semibold text-white">System Metrics</h2>
      <button 
        @click="refreshMetrics" 
        class="p-2 rounded-md hover:bg-gray-700 transition-colors"
        :disabled="loading"
      >
        <div class="h-5 w-5 text-gray-400" :class="{ 'animate-spin': loading }">
          ↻
        </div>
      </button>
    </div>

    <!-- System Metrics -->
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <!-- CPU Card -->
      <div class="rounded-lg border bg-card text-card-foreground shadow-sm">
        <div class="p-6">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-medium">CPU Usage</h3>
            <span class="text-sm text-muted-foreground">{{ metrics.cpu?.cores }} Cores</span>
          </div>
          <div class="mt-4">
            <div class="text-3xl font-bold">{{ formatNumber(metrics.cpu?.usage) }}%</div>
            <div class="mt-2 h-2 w-full rounded-full bg-secondary">
              <div
                class="h-2 rounded-full bg-primary transition-all"
                :style="{ width: `${metrics.cpu?.usage || 0}%` }"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Memory Card -->
      <div class="rounded-lg border bg-card text-card-foreground shadow-sm">
        <div class="p-6">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-medium">Memory Usage</h3>
            <span class="text-sm text-muted-foreground">{{ formatBytes(metrics.memory?.total || 0) }}</span>
          </div>
          <div class="mt-4">
            <div class="text-3xl font-bold">{{ formatBytes(metrics.memory?.used || 0) }}</div>
            <div class="mt-2 h-2 w-full rounded-full bg-secondary">
              <div
                class="h-2 rounded-full bg-primary transition-all"
                :style="{ width: `${(metrics.memory?.used || 0) / (metrics.memory?.total || 1) * 100}%` }"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Disk Card -->
      <div class="rounded-lg border bg-card text-card-foreground shadow-sm">
        <div class="p-6">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-medium">Disk Usage</h3>
            <span class="text-sm text-muted-foreground">{{ formatBytes(metrics.disk?.total || 0) }}</span>
          </div>
          <div class="mt-4">
            <div class="text-3xl font-bold">{{ formatBytes(metrics.disk?.used || 0) }}</div>
            <div class="mt-2 h-2 w-full rounded-full bg-secondary">
              <div
                class="h-2 rounded-full bg-primary transition-all"
                :style="{ width: `${(metrics.disk?.used || 0) / (metrics.disk?.total || 1) * 100}%` }"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Application Metrics -->
    <div class="mt-8">
      <h2 class="text-2xl font-semibold text-white mb-6">Application Metrics</h2>
      <ApplicationMetrics />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import ApplicationMetrics from './ApplicationMetrics.vue';

interface SystemMetrics {
  cpu?: {
    usage: number;
    cores: number;
    temperature?: number;
  };
  memory?: {
    total: number;
    used: number;
    free: number;
  };
  disk?: {
    total: number;
    used: number;
    free: number;
  };
  network?: {
    bytesIn: number;
    bytesOut: number;
  };
}

const metrics = ref<SystemMetrics>({});
const loading = ref(false);
const error = ref<string | null>(null);

// API基础URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:9700/api';

const formatNumber = (num?: number): string => {
  if (num === undefined) return '0';
  return num.toFixed(1);
};

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

const refreshMetrics = () => {
  fetchMetrics();
};

const fetchMetrics = async () => {
  loading.value = true;
  error.value = null;
  
  try {
    const response = await fetch(`${API_BASE_URL}/metrics/latest`);
    
    if (!response.ok) {
      throw new Error(`API错误: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.success && data.data) {
      metrics.value = {
        cpu: {
          usage: data.data.cpu.usage,
          temperature: data.data.cpu.temperature,
          cores: 4 // 默认假设为4核，实际应从API获取
        },
        memory: data.data.memory,
        disk: data.data.disk,
        network: data.data.network
      };
    } else {
      throw new Error('获取指标数据失败');
    }
  } catch (err) {
    console.error('Failed to fetch metrics:', err);
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
const generateMockMetrics = (): SystemMetrics => {
  return {
    cpu: {
      usage: Math.round(Math.random() * 80 + 10),
      temperature: Math.round((Math.random() * 30 + 35) * 10) / 10,
      cores: 4
    },
    memory: {
      total: 16384,
      used: Math.round(Math.random() * 8192 + 4096),
      free: Math.round(Math.random() * 4096 + 2048)
    },
    disk: {
      total: 512 * 1024,
      used: Math.round(Math.random() * 256 * 1024 + 128 * 1024),
      free: Math.round(Math.random() * 128 * 1024)
    },
    network: {
      bytesIn: Math.round(Math.random() * 5 * 1024 * 1024),
      bytesOut: Math.round(Math.random() * 3 * 1024 * 1024)
    }
  };
};

onMounted(() => {
  fetchMetrics();
  // Update metrics every 10 seconds
  setInterval(fetchMetrics, 10000);
});
</script> 