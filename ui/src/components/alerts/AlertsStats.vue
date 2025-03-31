<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';

interface AlertStats {
  total: number;
  active: number;
  acknowledged: number;
  resolved: number;
  bySeverity: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  byService: Record<string, number>;
  trend: {
    date: string;
    count: number;
  }[];
}

// State
const stats = ref<AlertStats>({
  total: 0,
  active: 0,
  acknowledged: 0,
  resolved: 0,
  bySeverity: {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0
  },
  byService: {},
  trend: []
});

const loading = ref(false);

// API基础URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:9700/api';

// Computed
const criticalPercentage = computed(() => {
  return stats.value.total > 0 
    ? Math.round((stats.value.bySeverity.critical / stats.value.total) * 100) 
    : 0;
});

const topServices = computed(() => {
  return Object.entries(stats.value.byService)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);
});

// Methods
const fetchStats = async () => {
  try {
    loading.value = true;
    const response = await fetch(`${API_BASE_URL}/alerts/stats`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch alert statistics');
    }

    const data = await response.json();
    if (data.success) {
      stats.value = data.stats;
    }
  } catch (error) {
    console.error('Error fetching alert statistics:', error);
    if (import.meta.env.DEV) {
      generateMockData();
    }
  } finally {
    loading.value = false;
  }
};

const generateMockData = () => {
  stats.value = {
    total: 156,
    active: 45,
    acknowledged: 28,
    resolved: 83,
    bySeverity: {
      critical: 12,
      high: 33,
      medium: 67,
      low: 44
    },
    byService: {
      'api-gateway': 35,
      'auth-service': 28,
      'database': 45,
      'cache': 22,
      'user-service': 15,
      'payment-service': 11
    },
    trend: Array.from({ length: 7 }, (_, i) => ({
      date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      count: Math.floor(Math.random() * 30) + 10
    })).reverse()
  };
};

const formatNumber = (num: number) => {
  return num.toLocaleString();
};

// Initialize
onMounted(() => {
  fetchStats();
  // Refresh stats every minute
  setInterval(fetchStats, 60000);
});
</script>

<template>
  <div class="space-y-6">
    <!-- Stats Overview -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="bg-gray-800 rounded-lg border border-gray-700 p-4">
        <h3 class="text-sm font-medium text-gray-400">Total Alerts</h3>
        <p class="mt-2 text-2xl font-semibold text-white">{{ formatNumber(stats.total) }}</p>
        <div class="mt-2 flex items-center text-sm">
          <span class="text-red-400">{{ stats.active }} active</span>
          <span class="mx-2 text-gray-600">•</span>
          <span class="text-green-400">{{ stats.resolved }} resolved</span>
        </div>
      </div>
      <div class="bg-gray-800 rounded-lg border border-gray-700 p-4">
        <h3 class="text-sm font-medium text-gray-400">Critical Alerts</h3>
        <p class="mt-2 text-2xl font-semibold text-red-400">{{ stats.bySeverity.critical }}</p>
        <div class="mt-2 text-sm text-gray-400">
          {{ criticalPercentage }}% of total alerts
        </div>
      </div>
      <div class="bg-gray-800 rounded-lg border border-gray-700 p-4">
        <h3 class="text-sm font-medium text-gray-400">Acknowledged</h3>
        <p class="mt-2 text-2xl font-semibold text-yellow-400">{{ stats.acknowledged }}</p>
        <div class="mt-2 text-sm text-gray-400">
          Waiting for resolution
        </div>
      </div>
      <div class="bg-gray-800 rounded-lg border border-gray-700 p-4">
        <h3 class="text-sm font-medium text-gray-400">Resolution Rate</h3>
        <p class="mt-2 text-2xl font-semibold text-green-400">
          {{ Math.round((stats.resolved / stats.total) * 100) }}%
        </p>
        <div class="mt-2 text-sm text-gray-400">
          {{ stats.resolved }} resolved alerts
        </div>
      </div>
    </div>

    <!-- Detailed Stats -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Severity Distribution -->
      <div class="bg-gray-800 rounded-lg border border-gray-700 p-4">
        <h3 class="text-lg font-semibold text-white mb-4">Severity Distribution</h3>
        <div class="space-y-4">
          <div v-for="(count, severity) in stats.bySeverity" :key="severity" class="flex items-center">
            <span class="w-24 text-gray-400 capitalize">{{ severity }}</span>
            <div class="flex-1 mx-4">
              <div class="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  :class="{
                    'bg-red-500': severity === 'critical',
                    'bg-orange-500': severity === 'high',
                    'bg-yellow-500': severity === 'medium',
                    'bg-blue-500': severity === 'low'
                  }"
                  class="h-full"
                  :style="{ width: `${(count / stats.total) * 100}%` }"
                ></div>
              </div>
            </div>
            <span class="text-gray-400 w-12 text-right">{{ count }}</span>
          </div>
        </div>
      </div>

      <!-- Top Services -->
      <div class="bg-gray-800 rounded-lg border border-gray-700 p-4">
        <h3 class="text-lg font-semibold text-white mb-4">Top Services</h3>
        <div class="space-y-4">
          <div v-for="[service, count] in topServices" :key="service" class="flex items-center">
            <span class="flex-1 text-gray-300">{{ service }}</span>
            <div class="flex items-center gap-2">
              <div class="h-2 w-24 bg-gray-700 rounded-full overflow-hidden">
                <div
                  class="h-full bg-blue-500"
                  :style="{ width: `${(count / Math.max(...Object.values(stats.byService))) * 100}%` }"
                ></div>
              </div>
              <span class="text-gray-400 w-12 text-right">{{ count }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Alert Trend -->
    <div class="bg-gray-800 rounded-lg border border-gray-700 p-4">
      <h3 class="text-lg font-semibold text-white mb-4">Alert Trend (7 Days)</h3>
      <div class="h-48 flex items-end justify-between">
        <div
          v-for="point in stats.trend"
          :key="point.date"
          class="flex flex-col items-center gap-2 flex-1"
        >
          <div
            class="w-full max-w-[40px] bg-blue-500 rounded-t"
            :style="{ 
              height: `${(point.count / Math.max(...stats.trend.map(p => p.count))) * 100}%`,
              opacity: 0.7 + (0.3 * (point.count / Math.max(...stats.trend.map(p => p.count))))
            }"
          ></div>
          <span class="text-xs text-gray-400">{{ new Date(point.date).toLocaleDateString(undefined, { weekday: 'short' }) }}</span>
          <span class="text-xs text-gray-500">{{ point.count }}</span>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="absolute inset-0 bg-gray-900/50 flex items-center justify-center">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
    </div>
  </div>
</template> 