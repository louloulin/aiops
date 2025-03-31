<template>
  <div class="container mx-auto px-4 py-6">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-3xl font-bold text-white">Auto-Healing System</h1>
      <div class="flex items-center gap-4">
        <button class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
          Configure Rules
        </button>
        <button class="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors">
          View Settings
        </button>
      </div>
    </div>
    
    <AutohealDashboard />
  </div>
</template>

<script setup lang="ts">
import AutohealDashboard from '../components/autoheal/AutohealDashboard.vue';
</script> 