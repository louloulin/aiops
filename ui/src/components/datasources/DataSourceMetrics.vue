<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';

interface MetricsData {
  sourceId: string;
  sourceName: string;
  sourceType: string;
  metrics: {
    id: string;
    name: string;
    value: number;
    unit: string;
    timestamp: Date;
    status: 'normal' | 'warning' | 'critical';
    trend: number[];
  }[];
}

interface GroupedMetrics {
  [key: string]: {
    metrics: MetricsData['metrics'];
    sources: string[];
  };
}

// State
const metricsData = ref<MetricsData[]>([]);
const loading = ref(true);
const selectedSource = ref<string>('all');
const metricView = ref<'list' | 'grid'>('grid');

// API基础URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:9700/api';

// Computed
const sources = computed(() => {
  const uniqueSources = new Set<string>();
  metricsData.value.forEach(data => {
    uniqueSources.add(data.sourceName);
  });
  return Array.from(uniqueSources);
});

const filteredMetrics = computed(() => {
  if (selectedSource.value === 'all') {
    return metricsData.value;
  }
  
  return metricsData.value.filter(data => 
    data.sourceName === selectedSource.value
  );
});

const groupedMetrics = computed(() => {
  const grouped: GroupedMetrics = {};
  
  filteredMetrics.value.forEach(sourceData => {
    sourceData.metrics.forEach(metric => {
      if (!grouped[metric.name]) {
        grouped[metric.name] = {
          metrics: [],
          sources: []
        };
      }
      
      grouped[metric.name].metrics.push(metric);
      if (!grouped[metric.name].sources.includes(sourceData.sourceName)) {
        grouped[metric.name].sources.push(sourceData.sourceName);
      }
    });
  });
  
  return grouped;
});

// Methods
const fetchMetrics = async () => {
  try {
    loading.value = true;
    const response = await fetch(`${API_BASE_URL}/datasources/metrics`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch metrics data');
    }

    const data = await response.json();
    if (data.success) {
      metricsData.value = data.metrics;
    }
  } catch (error) {
    console.error('Error fetching metrics data:', error);
    if (import.meta.env.DEV) {
      generateMockData();
    }
  } finally {
    loading.value = false;
  }
};

const generateMockData = () => {
  const sourceTypes = ['prometheus', 'grafana', 'elasticsearch', 'cloudwatch', 'database'];
  const metricNames = [
    'CPU Usage', 'Memory Usage', 'Disk I/O', 'Network Traffic', 
    'Request Rate', 'Error Rate', 'Response Time', 'Queue Length',
    'Database Connections', 'Cache Hit Rate'
  ];
  const units = ['%', 'MB', 'req/s', 'ms', 'count', 'GB/s'];
  const statuses = ['normal', 'warning', 'critical'];
  
  metricsData.value = Array.from({ length: 5 }, (_, i) => {
    const sourceType = sourceTypes[Math.floor(Math.random() * sourceTypes.length)];
    return {
      sourceId: `src-${i + 1}`,
      sourceName: `${sourceType.charAt(0).toUpperCase() + sourceType.slice(1)} ${i + 1}`,
      sourceType,
      metrics: Array.from({ length: 4 + Math.floor(Math.random() * 6) }, (_, j) => {
        const name = metricNames[Math.floor(Math.random() * metricNames.length)];
        const unit = units[Math.floor(Math.random() * units.length)];
        const status = statuses[Math.floor(Math.random() * statuses.length)] as 'normal' | 'warning' | 'critical';
        
        return {
          id: `metric-${i}-${j}`,
          name,
          value: Math.round(Math.random() * 100 * 100) / 100,
          unit,
          timestamp: new Date(Date.now() - Math.random() * 60000),
          status,
          trend: Array.from({ length: 10 }, () => Math.round(Math.random() * 100))
        };
      })
    };
  });
};

const formatValue = (value: number, unit: string) => {
  return `${value.toLocaleString()} ${unit}`;
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'normal':
      return 'bg-green-500';
    case 'warning':
      return 'bg-yellow-500';
    case 'critical':
      return 'bg-red-500';
    default:
      return 'bg-gray-500';
  }
};

const formatTimestamp = (date: Date) => {
  return new Date(date).toLocaleTimeString();
};

// Initialize
onMounted(() => {
  fetchMetrics();
  // Refresh every 30 seconds
  setInterval(fetchMetrics, 30000);
});
</script>

<template>
  <div class="space-y-6">
    <!-- Controls -->
    <div class="flex flex-col md:flex-row justify-between items-center gap-4">
      <div class="flex items-center space-x-4">
        <div>
          <label for="source-select" class="block text-sm font-medium text-gray-400 mb-1">Data Source</label>
          <select
            id="source-select"
            v-model="selectedSource"
            class="bg-gray-800 border border-gray-700 rounded-lg py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Sources</option>
            <option v-for="source in sources" :key="source" :value="source">{{ source }}</option>
          </select>
        </div>
      </div>
      
      <div class="flex items-center space-x-2">
        <button
          @click="metricView = 'grid'"
          :class="[
            'p-2 rounded-lg focus:outline-none',
            metricView === 'grid' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'
          ]"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
        </button>
        <button
          @click="metricView = 'list'"
          :class="[
            'p-2 rounded-lg focus:outline-none',
            metricView === 'list' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'
          ]"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
    
    <!-- Grid View -->
    <div v-if="metricView === 'grid'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="(data, metricName) in groupedMetrics"
        :key="metricName"
        class="bg-gray-800 border border-gray-700 rounded-lg p-4"
      >
        <div class="flex justify-between items-start mb-4">
          <div>
            <h3 class="text-lg font-medium text-white">{{ metricName }}</h3>
            <p class="text-sm text-gray-400">From {{ data.sources.join(', ') }}</p>
          </div>
          <span
            v-if="data.metrics.length > 0"
            class="px-2 py-1 text-xs rounded-full font-semibold"
            :class="getStatusColor(data.metrics[0].status)"
          >
            {{ data.metrics[0].status.toUpperCase() }}
          </span>
        </div>
        
        <div class="flex items-end space-x-1 h-10 mb-2">
          <div
            v-for="(value, index) in data.metrics[0]?.trend || []"
            :key="index"
            class="w-full bg-blue-500 rounded-sm"
            :style="{ 
              height: `${(value / Math.max(...(data.metrics[0]?.trend || [1]))) * 100}%`,
              opacity: 0.3 + (0.7 * (index / (data.metrics[0]?.trend?.length || 1)))
            }"
          ></div>
        </div>
        
        <div class="mt-4">
          <div class="flex justify-between">
            <span class="text-gray-400 text-sm">Current Value</span>
            <span class="text-white font-medium">
              {{ data.metrics[0] ? formatValue(data.metrics[0].value, data.metrics[0].unit) : 'N/A' }}
            </span>
          </div>
          <div class="flex justify-between mt-1">
            <span class="text-gray-400 text-sm">Last Update</span>
            <span class="text-gray-300 text-sm">
              {{ data.metrics[0] ? formatTimestamp(data.metrics[0].timestamp) : 'N/A' }}
            </span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- List View -->
    <div v-else class="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-700">
          <thead class="bg-gray-700">
            <tr>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Metric Name
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Source
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Value
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Last Update
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Trend
              </th>
            </tr>
          </thead>
          <tbody class="bg-gray-800 divide-y divide-gray-700">
            <template v-for="sourceData in filteredMetrics" :key="sourceData.sourceId">
              <tr v-for="metric in sourceData.metrics" :key="`${sourceData.sourceId}-${metric.id}`" class="hover:bg-gray-750">
                <td class="px-6 py-4">
                  <div class="text-sm font-medium text-white">{{ metric.name }}</div>
                </td>
                <td class="px-6 py-4">
                  <div class="text-sm text-gray-300">{{ sourceData.sourceName }}</div>
                </td>
                <td class="px-6 py-4">
                  <div class="text-sm text-white">{{ formatValue(metric.value, metric.unit) }}</div>
                </td>
                <td class="px-6 py-4">
                  <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full" :class="getStatusColor(metric.status)">
                    {{ metric.status.toUpperCase() }}
                  </span>
                </td>
                <td class="px-6 py-4">
                  <div class="text-sm text-gray-300">{{ formatTimestamp(metric.timestamp) }}</div>
                </td>
                <td class="px-6 py-4">
                  <div class="flex items-end h-6 space-x-1">
                    <div
                      v-for="(value, index) in metric.trend"
                      :key="index"
                      class="w-2 bg-blue-500 rounded-sm"
                      :style="{ 
                        height: `${(value / Math.max(...metric.trend)) * 100}%`,
                        opacity: 0.3 + (0.7 * (index / metric.trend.length))
                      }"
                    ></div>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </div>
    
    <!-- Loading State -->
    <div v-if="loading" class="absolute inset-0 bg-gray-900/50 flex items-center justify-center">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
    </div>
  </div>
</template> 