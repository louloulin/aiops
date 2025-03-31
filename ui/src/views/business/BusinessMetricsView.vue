<template>
  <div class="container mx-auto py-6 px-4">
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-2xl font-bold text-white">业务指标管理</h1>
        <p class="text-gray-400 mt-2">创建、管理和监控自定义业务指标</p>
      </div>
      
      <div class="flex gap-2">
        <router-link to="/business-metrics-dashboard" class="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
          <span class="material-icons-outlined mr-1 text-sm">dashboard</span>
          仪表盘视图
        </router-link>
      </div>
    </div>
    
    <BusinessMetricDefinition />
  </div>
</template>

<script setup lang="ts">
import BusinessMetricDefinition from '@/components/business/BusinessMetricDefinition.vue';
</script> 