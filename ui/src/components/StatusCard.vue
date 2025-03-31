<script setup lang="ts">
defineProps<{
  title: string;
  value: number;
  max?: number;
  unit: string;
  loading: boolean;
}>();

const getPercentage = (value: number, max: number = 100) => {
  if (!max) return 0;
  return Math.min(100, (value / max) * 100);
};

const getStatusColor = (percentage: number) => {
  if (percentage < 50) return 'bg-[#3ecf8e]';
  if (percentage < 80) return 'bg-amber-500';
  return 'bg-red-500';
};
</script>

<template>
  <div class="bg-[#212121] rounded-md border border-gray-800 p-4">
    <h3 class="text-gray-400 text-xs font-medium uppercase mb-2">{{ title }}</h3>
    
    <div v-if="loading" class="animate-pulse flex space-x-4">
      <div class="h-10 w-full bg-gray-700 rounded"></div>
    </div>
    
    <div v-else>
      <div class="flex items-center justify-between">
        <div class="text-xl font-mono text-white">
          {{ Math.round(value * 100) / 100 }} 
          <span class="text-xs font-normal text-gray-400">{{ unit }}</span>
        </div>
        <div v-if="max" class="text-xs text-gray-400">
          of {{ Math.round(max * 100) / 100 }} {{ unit }}
        </div>
      </div>
      
      <div class="mt-3">
        <div class="w-full bg-gray-800 rounded-full h-1.5">
          <div
            class="h-1.5 rounded-full"
            :class="getStatusColor(getPercentage(value, max))"
            :style="{ width: `${getPercentage(value, max)}%` }"
          ></div>
        </div>
      </div>
    </div>
  </div>
</template> 