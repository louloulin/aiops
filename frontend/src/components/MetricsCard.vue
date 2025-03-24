<script setup lang="ts">
import { ref, computed } from 'vue';

const props = defineProps<{
  metrics: any;
  loading: boolean;
}>();

const emit = defineEmits(['refresh']);

const tabSelected = ref('overview');

const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'cpu', label: 'CPU' },
  { id: 'memory', label: 'Memory' },
  { id: 'disk', label: 'Disk' },
  { id: 'network', label: 'Network' },
];

const refreshData = () => {
  emit('refresh');
};

const formatValue = (value: number) => {
  return Math.round(value * 100) / 100;
};

const cpuPercentage = computed(() => {
  if (!props.metrics?.cpu?.usage) return 0;
  return Math.min(100, Math.max(0, props.metrics.cpu.usage));
});

const memoryPercentage = computed(() => {
  if (!props.metrics?.memory?.total || !props.metrics?.memory?.used) return 0;
  return Math.min(100, Math.max(0, (props.metrics.memory.used / props.metrics.memory.total) * 100));
});

const diskPercentage = computed(() => {
  if (!props.metrics?.disk?.total || !props.metrics?.disk?.used) return 0;
  return Math.min(100, Math.max(0, (props.metrics.disk.used / props.metrics.disk.total) * 100));
});
</script>

<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
    <div class="flex justify-between items-center px-4 py-3 border-b border-gray-200 dark:border-gray-700">
      <h2 class="text-lg font-medium">System Metrics</h2>
      <button 
        @click="refreshData" 
        class="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        :disabled="loading"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          class="h-5 w-5 text-gray-600 dark:text-gray-400"
          :class="{ 'animate-spin': loading }"
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </button>
    </div>
    
    <div class="border-b border-gray-200 dark:border-gray-700">
      <nav class="flex overflow-x-auto" aria-label="Tabs">
        <button 
          v-for="tab in tabs" 
          :key="tab.id"
          @click="tabSelected = tab.id"
          class="px-4 py-2 text-sm font-medium whitespace-nowrap"
          :class="tabSelected === tab.id ? 
                  'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' : 
                  'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'"
        >
          {{ tab.label }}
        </button>
      </nav>
    </div>
    
    <div class="p-4">
      <div v-if="loading" class="animate-pulse space-y-4">
        <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
        <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
        <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
      </div>
      
      <div v-else-if="!metrics" class="text-center py-6 text-gray-500 dark:text-gray-400">
        No metrics data available
      </div>
      
      <div v-else>
        <!-- Overview Tab -->
        <div v-if="tabSelected === 'overview'" class="space-y-4">
          <div>
            <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">CPU Usage</h3>
            <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
              <div 
                class="h-2.5 rounded-full bg-blue-600" 
                :style="{ width: `${cpuPercentage}%` }"
              ></div>
            </div>
            <div class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {{ formatValue(cpuPercentage) }}%
            </div>
          </div>
          
          <div>
            <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Memory Usage</h3>
            <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
              <div 
                class="h-2.5 rounded-full bg-purple-600" 
                :style="{ width: `${memoryPercentage}%` }"
              ></div>
            </div>
            <div class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {{ formatValue(memoryPercentage) }}% ({{ formatValue(metrics.memory.used) }} MB / {{ formatValue(metrics.memory.total) }} MB)
            </div>
          </div>
          
          <div>
            <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Disk Usage</h3>
            <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
              <div 
                class="h-2.5 rounded-full bg-green-600" 
                :style="{ width: `${diskPercentage}%` }"
              ></div>
            </div>
            <div class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {{ formatValue(diskPercentage) }}% ({{ formatValue(metrics.disk.used / 1024) }} GB / {{ formatValue(metrics.disk.total / 1024) }} GB)
            </div>
          </div>
          
          <div>
            <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Network Traffic</h3>
            <div class="flex justify-between text-sm">
              <div>
                <span class="font-medium">In:</span> {{ formatValue(metrics.network.bytesIn / 1024) }} KB/s
              </div>
              <div>
                <span class="font-medium">Out:</span> {{ formatValue(metrics.network.bytesOut / 1024) }} KB/s
              </div>
            </div>
          </div>
        </div>
        
        <!-- CPU Tab -->
        <div v-else-if="tabSelected === 'cpu'" class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div class="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
              <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Usage</h3>
              <div class="text-xl font-bold">{{ formatValue(metrics.cpu.usage) }}%</div>
            </div>
            <div class="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
              <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Temperature</h3>
              <div class="text-xl font-bold">{{ formatValue(metrics.cpu.temperature) }}°C</div>
            </div>
          </div>
        </div>
        
        <!-- Memory Tab -->
        <div v-else-if="tabSelected === 'memory'" class="space-y-4">
          <div class="grid grid-cols-3 gap-4">
            <div class="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
              <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Total</h3>
              <div class="text-xl font-bold">{{ formatValue(metrics.memory.total) }} MB</div>
            </div>
            <div class="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
              <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Used</h3>
              <div class="text-xl font-bold">{{ formatValue(metrics.memory.used) }} MB</div>
            </div>
            <div class="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
              <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Free</h3>
              <div class="text-xl font-bold">{{ formatValue(metrics.memory.free) }} MB</div>
            </div>
          </div>
        </div>
        
        <!-- Disk Tab -->
        <div v-else-if="tabSelected === 'disk'" class="space-y-4">
          <div class="grid grid-cols-3 gap-4">
            <div class="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
              <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Total</h3>
              <div class="text-xl font-bold">{{ formatValue(metrics.disk.total / 1024) }} GB</div>
            </div>
            <div class="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
              <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Used</h3>
              <div class="text-xl font-bold">{{ formatValue(metrics.disk.used / 1024) }} GB</div>
            </div>
            <div class="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
              <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Free</h3>
              <div class="text-xl font-bold">{{ formatValue(metrics.disk.free / 1024) }} GB</div>
            </div>
          </div>
        </div>
        
        <!-- Network Tab -->
        <div v-else-if="tabSelected === 'network'" class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div class="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
              <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Bytes In</h3>
              <div class="text-xl font-bold">{{ formatValue(metrics.network.bytesIn / 1024) }} KB/s</div>
            </div>
            <div class="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
              <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Bytes Out</h3>
              <div class="text-xl font-bold">{{ formatValue(metrics.network.bytesOut / 1024) }} KB/s</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template> 