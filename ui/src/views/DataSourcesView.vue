<script setup lang="ts">
import { ref } from 'vue';
import DataSourceList from '../components/datasources/DataSourceList.vue';
import DataSourceMetrics from '../components/datasources/DataSourceMetrics.vue';

const activeTab = ref<'sources' | 'metrics'>('sources');
</script>

<template>
  <div class="space-y-6 p-6">
    <div class="flex justify-between items-center">
      <h1 class="text-2xl font-semibold text-white">数据源管理</h1>
      <div class="flex gap-4">
        <button class="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd" />
          </svg>
          设置
        </button>
        <button class="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
          </svg>
          添加数据源
        </button>
      </div>
    </div>

    <!-- Tab Navigation -->
    <div class="border-b border-gray-700">
      <nav class="-mb-px flex space-x-8" aria-label="Tabs">
        <button
          @click="activeTab = 'sources'"
          :class="[
            'py-4 px-1 border-b-2 font-medium text-sm',
            activeTab === 'sources'
              ? 'border-blue-500 text-blue-500'
              : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
          ]"
        >
          数据源
        </button>
        <button
          @click="activeTab = 'metrics'"
          :class="[
            'py-4 px-1 border-b-2 font-medium text-sm',
            activeTab === 'metrics'
              ? 'border-blue-500 text-blue-500'
              : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
          ]"
        >
          指标监控
        </button>
      </nav>
    </div>

    <!-- Tab Content -->
    <div class="mt-6">
      <div v-if="activeTab === 'sources'">
        <DataSourceList />
      </div>
      <div v-else-if="activeTab === 'metrics'">
        <DataSourceMetrics />
      </div>
    </div>
  </div>
</template> 