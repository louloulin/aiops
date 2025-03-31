<script setup lang="ts">
import { ref } from 'vue';
import BusinessMetricDefinition from '../components/business/BusinessMetricDefinition.vue';
import BusinessMetricsDashboard from '../components/business/BusinessMetricsDashboard.vue';

const activeTab = ref<'dashboard' | 'definitions'>('dashboard');
</script>

<template>
  <div class="space-y-6 p-6">
    <div class="flex justify-between items-center">
      <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">业务指标监控</h1>
      <div class="flex gap-4">
        <button
          @click="activeTab = 'definitions'"
          class="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zM11 4a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zM16 3a1 1 0 011 1v7.268a2 2 0 010 3.464V16a1 1 0 11-2 0v-1.268a2 2 0 010-3.464V4a1 1 0 011-1z" />
          </svg>
          配置指标
        </button>
        <button class="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clip-rule="evenodd" />
          </svg>
          导出报告
        </button>
      </div>
    </div>

    <!-- Tab Navigation -->
    <div class="border-b border-gray-200 dark:border-gray-700">
      <nav class="-mb-px flex space-x-8" aria-label="Tabs">
        <button
          @click="activeTab = 'dashboard'"
          :class="[
            'py-4 px-1 border-b-2 font-medium text-sm',
            activeTab === 'dashboard'
              ? 'border-blue-500 text-blue-600 dark:text-blue-500'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
          ]"
        >
          仪表盘
        </button>
        <button
          @click="activeTab = 'definitions'"
          :class="[
            'py-4 px-1 border-b-2 font-medium text-sm',
            activeTab === 'definitions'
              ? 'border-blue-500 text-blue-600 dark:text-blue-500'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
          ]"
        >
          指标定义
        </button>
      </nav>
    </div>

    <!-- Tab Content -->
    <div class="mt-6">
      <div v-if="activeTab === 'dashboard'">
        <BusinessMetricsDashboard />
      </div>
      <div v-else-if="activeTab === 'definitions'">
        <BusinessMetricDefinition />
      </div>
    </div>
  </div>
</template> 