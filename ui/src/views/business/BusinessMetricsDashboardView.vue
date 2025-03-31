<template>
  <div class="container mx-auto py-6 px-4">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-white">业务指标仪表盘</h1>
      <p class="text-gray-400 mt-2">查看和监控所有关键业务指标的状态和趋势</p>
    </div>
    
    <BusinessMetricsDashboard />
  </div>
</template>

<script setup lang="ts">
import BusinessMetricsDashboard from '@/components/business/BusinessMetricsDashboard.vue';
</script> 