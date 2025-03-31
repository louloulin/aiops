<script setup lang="ts">
import { ref } from 'vue';
import MetricsCard from '../components/MetricsCard.vue';

// Data
const metrics = ref(null);
const loading = ref(true);

// Fetch metrics
const fetchMetrics = async () => {
  try {
    loading.value = true;
    const response = await fetch('/api/metrics');
    metrics.value = await response.json();
  } catch (error) {
    console.error('Error fetching metrics:', error);
  } finally {
    loading.value = false;
  }
};

// Initialize
fetchMetrics();
</script>

<template>
  <div>
    <h1 class="text-3xl font-bold mb-6">System Metrics</h1>
    <p>Detailed metrics view coming soon</p>
  </div>
</template> 