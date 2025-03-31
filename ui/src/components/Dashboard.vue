<script setup lang="ts">
import { ref, onMounted } from 'vue';
import MetricsCard from './MetricsCard.vue';
import LogsCard from './LogsCard.vue';
import DeploymentCard from './DeploymentCard.vue';
import StatusCard from './StatusCard.vue';

interface Metrics {
  cpu: {
    usage: number;
    temperature: number;
  };
  memory: {
    total: number;
    used: number;
    free: number;
  };
  disk: {
    total: number;
    used: number;
    free: number;
  };
  network: {
    bytesIn: number;
    bytesOut: number;
  };
}

// Data
const metrics = ref<Metrics | null>(null);
const logs = ref<any[]>([]);
const deployments = ref<any[]>([]);
const loading = ref({
  metrics: true,
  logs: true,
  deployments: true,
});

// Fetch data
const fetchMetrics = async () => {
  try {
    loading.value.metrics = true;
    const response = await fetch(`${import.meta.env.VITE_API_URL}/metrics/latest`);
    const data = await response.json();
    if (data.success && data.data) {
      metrics.value = data.data;
    }
  } catch (error) {
    console.error('Error fetching metrics:', error);
  } finally {
    loading.value.metrics = false;
  }
};

const fetchLogs = async () => {
  try {
    loading.value.logs = true;
    const response = await fetch(`${import.meta.env.VITE_API_URL}/logs?limit=5`);
    logs.value = await response.json();
  } catch (error) {
    console.error('Error fetching logs:', error);
    // 开发环境中生成模拟数据
    if (import.meta.env.DEV) {
      logs.value = [
        { level: 'error', message: 'Database connection failed', service: 'api', timestamp: new Date().toISOString() },
        { level: 'warn', message: 'High CPU usage detected', service: 'monitoring', timestamp: new Date().toISOString() },
        { level: 'info', message: 'Application started successfully', service: 'api', timestamp: new Date().toISOString() },
        { level: 'debug', message: 'Processing request #1234', service: 'api', timestamp: new Date().toISOString() },
        { level: 'info', message: 'User login successful', service: 'auth', timestamp: new Date().toISOString() },
      ];
    }
  } finally {
    loading.value.logs = false;
  }
};

const fetchDeployments = async () => {
  try {
    loading.value.deployments = true;
    const response = await fetch(`${import.meta.env.VITE_API_URL}/deploy?limit=5`);
    deployments.value = await response.json();
  } catch (error) {
    console.error('Error fetching deployments:', error);
    // 开发环境中生成模拟数据
    if (import.meta.env.DEV) {
      deployments.value = [
        { id: 1, name: 'api-service', version: 'v1.2.3', status: 'success', timestamp: new Date().toISOString() },
        { id: 2, name: 'ui', version: 'v2.0.1', status: 'pending', timestamp: new Date().toISOString() },
        { id: 3, name: 'database', version: 'v1.0.5', status: 'success', timestamp: new Date().toISOString() },
      ];
    }
  } finally {
    loading.value.deployments = false;
  }
};

// Initialize
onMounted(() => {
  fetchMetrics();
  fetchLogs();
  fetchDeployments();
});
</script>

<template>
  <div class="h-full w-full">
    <h1 class="text-2xl font-medium text-white mb-6">AI OPS Dashboard</h1>
    
    <!-- System Status Overview -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <StatusCard title="CPU Usage" :value="metrics?.cpu?.usage || 0" unit="%" :loading="loading.metrics" />
      <StatusCard title="Memory Usage" 
                 :value="metrics?.memory?.used || 0" 
                 :max="metrics?.memory?.total || 0" 
                 unit="MB" 
                 :loading="loading.metrics" />
      <StatusCard title="Disk Usage" 
                 :value="metrics?.disk?.used || 0" 
                 :max="metrics?.disk?.total || 0" 
                 unit="GB" 
                 :loading="loading.metrics" />
      <StatusCard title="Network" 
                 :value="metrics?.network?.bytesIn || 0" 
                 unit="bytes/s" 
                 :loading="loading.metrics" />
    </div>
    
    <!-- Main Content -->
    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      <!-- Metrics Card -->
      <div class="col-span-1 xl:col-span-2">
        <MetricsCard :metrics="metrics" :loading="loading.metrics" @refresh="fetchMetrics" />
      </div>
      
      <!-- Recent Logs -->
      <div>
        <LogsCard :logs="logs" :loading="loading.logs" @refresh="fetchLogs" />
      </div>
      
      <!-- Recent Deployments -->
      <div class="col-span-1 xl:col-span-3">
        <DeploymentCard :deployments="deployments" :loading="loading.deployments" @refresh="fetchDeployments" />
      </div>
    </div>
  </div>
</template> 