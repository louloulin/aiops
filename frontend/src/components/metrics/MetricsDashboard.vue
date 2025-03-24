<!-- MetricsDashboard.vue -->
<template>
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
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

interface SystemMetrics {
  cpu?: {
    usage: number;
    cores: number;
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
}

const metrics = ref<SystemMetrics>({});

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

const fetchMetrics = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/metrics');
    metrics.value = await response.json();
  } catch (error) {
    console.error('Failed to fetch metrics:', error);
  }
};

onMounted(() => {
  fetchMetrics();
  // Update metrics every 5 seconds
  setInterval(fetchMetrics, 5000);
});
</script> 