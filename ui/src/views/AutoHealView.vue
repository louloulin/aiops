<template>
  <div class="container mx-auto px-4 py-6">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white">自动修复系统</h1>
      <div class="flex items-center gap-4">
        <button class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
          配置规则
        </button>
        <button class="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
          查看设置
        </button>
      </div>
    </div>
    
    <AutohealDashboard />
  </div>
</template>

<script setup lang="ts">
import AutohealDashboard from '../components/autoheal/AutohealDashboard.vue';
</script> 