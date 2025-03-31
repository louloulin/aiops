<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';

interface Alert {
  id: string;
  title: string;
  service: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'active' | 'acknowledged' | 'resolved';
  source: string;
  timestamp: string;
  description: string;
  count: number;
}

// State
const alerts = ref<Alert[]>([]);
const loading = ref(false);
const selectedAlert = ref<Alert | null>(null);
const filterSeverity = ref<string>('all');
const filterStatus = ref<string>('all');
const filterService = ref<string>('all');
const searchQuery = ref('');

// API基础URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:9700/api';

// Computed
const filteredAlerts = computed(() => {
  return alerts.value.filter(alert => {
    const matchesSeverity = filterSeverity.value === 'all' || alert.severity === filterSeverity.value;
    const matchesStatus = filterStatus.value === 'all' || alert.status === filterStatus.value;
    const matchesService = filterService.value === 'all' || alert.service === filterService.value;
    const matchesSearch = searchQuery.value === '' || 
      alert.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      alert.description.toLowerCase().includes(searchQuery.value.toLowerCase());
    
    return matchesSeverity && matchesStatus && matchesService && matchesSearch;
  });
});

const services = computed(() => {
  const uniqueServices = new Set(alerts.value.map(alert => alert.service));
  return Array.from(uniqueServices);
});

// Methods
const fetchAlerts = async () => {
  try {
    loading.value = true;
    const response = await fetch(`${API_BASE_URL}/alerts`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch alerts');
    }

    const data = await response.json();
    if (data.success) {
      alerts.value = data.alerts;
    }
  } catch (error) {
    console.error('Error fetching alerts:', error);
    if (import.meta.env.DEV) {
      generateMockData();
    }
  } finally {
    loading.value = false;
  }
};

const generateMockData = () => {
  const mockAlerts: Alert[] = Array.from({ length: 10 }, (_, i) => ({
    id: `alert-${i + 1}`,
    title: ['High CPU Usage', 'Memory Leak', 'Disk Space Low', 'Service Down'][Math.floor(Math.random() * 4)],
    service: ['api-gateway', 'auth-service', 'database', 'cache'][Math.floor(Math.random() * 4)],
    severity: ['critical', 'high', 'medium', 'low'][Math.floor(Math.random() * 4)] as Alert['severity'],
    status: ['active', 'acknowledged', 'resolved'][Math.floor(Math.random() * 3)] as Alert['status'],
    source: ['monitoring', 'logs', 'metrics'][Math.floor(Math.random() * 3)],
    timestamp: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
    description: 'Alert description with detailed information about the issue.',
    count: Math.floor(Math.random() * 10) + 1
  }));

  alerts.value = mockAlerts;
};

const getSeverityColor = (severity: string) => {
  const colors = {
    critical: 'bg-red-500/20 text-red-400',
    high: 'bg-orange-500/20 text-orange-400',
    medium: 'bg-yellow-500/20 text-yellow-400',
    low: 'bg-blue-500/20 text-blue-400'
  };
  return colors[severity as keyof typeof colors] || colors.low;
};

const getStatusColor = (status: string) => {
  const colors = {
    active: 'bg-red-500/20 text-red-400',
    acknowledged: 'bg-yellow-500/20 text-yellow-400',
    resolved: 'bg-green-500/20 text-green-400'
  };
  return colors[status as keyof typeof colors] || colors.active;
};

const formatDate = (date: string) => {
  return new Date(date).toLocaleString();
};

const acknowledgeAlert = async (alertId: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/alerts/${alertId}/acknowledge`, {
      method: 'POST'
    });

    if (!response.ok) {
      throw new Error('Failed to acknowledge alert');
    }

    await fetchAlerts();
  } catch (error) {
    console.error('Error acknowledging alert:', error);
  }
};

const resolveAlert = async (alertId: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/alerts/${alertId}/resolve`, {
      method: 'POST'
    });

    if (!response.ok) {
      throw new Error('Failed to resolve alert');
    }

    await fetchAlerts();
  } catch (error) {
    console.error('Error resolving alert:', error);
  }
};

// Initialize
onMounted(() => {
  fetchAlerts();
  // Refresh alerts every 30 seconds
  setInterval(fetchAlerts, 30000);
});
</script>

<template>
  <div class="space-y-6">
    <!-- Filters -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search alerts..."
        class="px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <select
        v-model="filterSeverity"
        class="px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="all">All Severities</option>
        <option value="critical">Critical</option>
        <option value="high">High</option>
        <option value="medium">Medium</option>
        <option value="low">Low</option>
      </select>
      <select
        v-model="filterStatus"
        class="px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="all">All Statuses</option>
        <option value="active">Active</option>
        <option value="acknowledged">Acknowledged</option>
        <option value="resolved">Resolved</option>
      </select>
      <select
        v-model="filterService"
        class="px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="all">All Services</option>
        <option v-for="service in services" :key="service" :value="service">
          {{ service }}
        </option>
      </select>
    </div>

    <!-- Alerts Table -->
    <div class="bg-gray-800 rounded-lg border border-gray-700">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-gray-700">
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Alert</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Service</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Severity</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Time</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Count</th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-700">
            <tr v-for="alert in filteredAlerts" :key="alert.id" class="hover:bg-gray-700/50">
              <td class="px-6 py-4">
                <div class="flex flex-col">
                  <span class="text-white font-medium">{{ alert.title }}</span>
                  <span class="text-gray-400 text-sm">{{ alert.description }}</span>
                </div>
              </td>
              <td class="px-6 py-4 text-gray-300">{{ alert.service }}</td>
              <td class="px-6 py-4">
                <span :class="[getSeverityColor(alert.severity), 'px-2 py-1 rounded-full text-xs font-medium']">
                  {{ alert.severity }}
                </span>
              </td>
              <td class="px-6 py-4">
                <span :class="[getStatusColor(alert.status), 'px-2 py-1 rounded-full text-xs font-medium']">
                  {{ alert.status }}
                </span>
              </td>
              <td class="px-6 py-4 text-gray-300">{{ formatDate(alert.timestamp) }}</td>
              <td class="px-6 py-4 text-gray-300">{{ alert.count }}</td>
              <td class="px-6 py-4 text-right space-x-2">
                <button
                  v-if="alert.status === 'active'"
                  @click="acknowledgeAlert(alert.id)"
                  class="text-yellow-400 hover:text-yellow-300"
                >
                  Acknowledge
                </button>
                <button
                  v-if="alert.status !== 'resolved'"
                  @click="resolveAlert(alert.id)"
                  class="text-green-400 hover:text-green-300"
                >
                  Resolve
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
    </div>

    <!-- Empty State -->
    <div v-if="!loading && filteredAlerts.length === 0" class="text-center py-8 text-gray-400">
      No alerts found matching your filters
    </div>
  </div>
</template> 