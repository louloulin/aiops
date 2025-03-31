<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{
  logs: any[];
  loading: boolean;
}>();

const emit = defineEmits(['refresh']);

const refreshData = () => {
  emit('refresh');
};

const getLevelColor = (level: string) => {
  switch (level?.toLowerCase()) {
    case 'error':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    case 'warn':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    case 'info':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    case 'debug':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  }
};

const formatTimestamp = (timestamp: string) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleString();
};
</script>

<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden h-full">
    <div class="flex justify-between items-center px-4 py-3 border-b border-gray-200 dark:border-gray-700">
      <h2 class="text-lg font-medium">Recent Logs</h2>
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
    
    <div class="p-4">
      <div v-if="loading" class="animate-pulse space-y-4">
        <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
        <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
        <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
      </div>
      
      <div v-else-if="!logs || logs.length === 0" class="text-center py-6 text-gray-500 dark:text-gray-400">
        No logs available
      </div>
      
      <div v-else class="space-y-3">
        <div v-for="(log, index) in logs" :key="index" class="border-b border-gray-200 dark:border-gray-700 pb-3 last:border-0 last:pb-0">
          <div class="flex items-center justify-between">
            <span 
              class="px-2 py-1 text-xs font-medium rounded"
              :class="getLevelColor(log.level)"
            >
              {{ log.level }}
            </span>
            <span class="text-xs text-gray-500 dark:text-gray-400">
              {{ formatTimestamp(log.timestamp) }}
            </span>
          </div>
          <div class="mt-1 text-sm">{{ log.message }}</div>
          <div v-if="log.service" class="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Service: {{ log.service }}
          </div>
        </div>
        
        <div class="text-center pt-2">
          <a href="#" class="text-sm text-blue-600 dark:text-blue-400 hover:underline">View all logs</a>
        </div>
      </div>
    </div>
  </div>
</template> 