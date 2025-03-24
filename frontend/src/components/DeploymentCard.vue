<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{
  deployments: any[];
  loading: boolean;
}>();

const emit = defineEmits(['refresh']);

const refreshData = () => {
  emit('refresh');
};

const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'completed':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case 'in_progress':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    case 'failed':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  }
};

const getEnvironmentColor = (environment: string) => {
  switch (environment?.toLowerCase()) {
    case 'production':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
    case 'staging':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    case 'development':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
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
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
    <div class="flex justify-between items-center px-4 py-3 border-b border-gray-200 dark:border-gray-700">
      <h2 class="text-lg font-medium">Recent Deployments</h2>
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
    
    <div class="overflow-x-auto">
      <div v-if="loading" class="p-4 animate-pulse space-y-4">
        <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
        <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
        <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
      </div>
      
      <div v-else-if="!deployments || deployments.length === 0" class="text-center py-6 text-gray-500 dark:text-gray-400">
        No deployments available
      </div>
      
      <table v-else class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead class="bg-gray-50 dark:bg-gray-900">
          <tr>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Name
            </th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Version
            </th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Environment
            </th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Status
            </th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Date
            </th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          <tr v-for="deployment in deployments" :key="deployment.id">
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm font-medium text-gray-900 dark:text-white">{{ deployment.name }}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm text-gray-900 dark:text-white">{{ deployment.version }}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full" 
                    :class="getEnvironmentColor(deployment.environment)">
                {{ deployment.environment }}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full" 
                    :class="getStatusColor(deployment.status)">
                {{ deployment.status }}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
              {{ formatTimestamp(deployment.created_at) }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
              <div class="flex space-x-2">
                <button 
                  v-if="deployment.status !== 'completed' && deployment.status !== 'failed'"
                  class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                >
                  Update
                </button>
                <button 
                  v-if="deployment.status === 'completed'"
                  class="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                >
                  Rollback
                </button>
                <button class="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300">
                  Details
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      
      <div class="p-4 text-center">
        <a href="#" class="text-sm text-blue-600 dark:text-blue-400 hover:underline">View all deployments</a>
      </div>
    </div>
  </div>
</template> 