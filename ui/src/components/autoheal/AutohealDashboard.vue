<!-- AutoHealDashboard.vue -->
<template>
  <div class="space-y-6">
    <!-- Status Overview -->
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <div class="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
        <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">活跃修复</h3>
        <p class="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">{{ activeRepairs.length }}</p>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
        <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">成功率</h3>
        <p class="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">{{ successRate }}%</p>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
        <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">已修复总数</h3>
        <p class="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">{{ totalFixed }}</p>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
        <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">平均修复时间</h3>
        <p class="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">{{ formatDuration(mttr) }}</p>
      </div>
    </div>

    <!-- Active Repairs -->
    <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
      <div class="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">活跃修复</h2>
      </div>
      <div class="p-4">
        <div v-if="activeRepairs.length === 0" class="text-center text-gray-500 dark:text-gray-400 py-8">
          没有活跃的修复任务
        </div>
        <div v-else class="space-y-4">
          <div
            v-for="repair in activeRepairs"
            :key="repair.id"
            class="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-800"
          >
            <div class="flex items-center justify-between mb-2">
              <div>
                <h3 class="text-gray-900 dark:text-white font-medium">{{ repair.issue }}</h3>
                <p class="text-sm text-gray-500 dark:text-gray-400">{{ repair.service }}</p>
              </div>
              <span
                :class="getStatusColor(repair.status)"
                class="px-3 py-1 rounded-full text-xs font-medium"
              >
                {{ repair.status }}
              </span>
            </div>
            <div class="mt-4">
              <div class="text-sm text-gray-500 dark:text-gray-400">进度</div>
              <div class="mt-2 h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full">
                <div
                  class="h-2 rounded-full bg-blue-500"
                  :style="{ width: `${repair.progress}%` }"
                ></div>
              </div>
            </div>
            <div class="mt-4 flex justify-between text-sm">
              <span class="text-gray-500 dark:text-gray-400">开始时间: {{ formatTime(repair.startTime) }}</span>
              <span class="text-gray-500 dark:text-gray-400">预计完成: {{ formatTime(repair.eta) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Repair History -->
    <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
      <div class="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">修复历史</h2>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="text-left border-b border-gray-200 dark:border-gray-700">
              <th class="p-4 text-gray-700 dark:text-gray-400 font-medium">问题</th>
              <th class="p-4 text-gray-700 dark:text-gray-400 font-medium">服务</th>
              <th class="p-4 text-gray-700 dark:text-gray-400 font-medium">状态</th>
              <th class="p-4 text-gray-700 dark:text-gray-400 font-medium">持续时间</th>
              <th class="p-4 text-gray-700 dark:text-gray-400 font-medium">修复时间</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="repair in repairHistory"
              :key="repair.id"
              class="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
            >
              <td class="p-4 text-sm text-gray-900 dark:text-white">{{ repair.issue }}</td>
              <td class="p-4 text-sm text-gray-600 dark:text-gray-300">{{ repair.service }}</td>
              <td class="p-4">
                <span
                  :class="getStatusColor(repair.status)"
                  class="px-2 py-1 rounded-full text-xs font-medium"
                >
                  {{ repair.status }}
                </span>
              </td>
              <td class="p-4 text-sm text-gray-600 dark:text-gray-300">{{ repair.duration ? formatDuration(repair.duration) : '-' }}</td>
              <td class="p-4 text-sm text-gray-600 dark:text-gray-300">{{ repair.fixedAt ? formatTime(repair.fixedAt) : '-' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';

interface Repair {
  id: string;
  issue: string;
  service: string;
  status: 'diagnosing' | 'repairing' | 'verifying' | 'completed' | 'failed';
  progress: number;
  startTime: string;
  eta: string;
  duration?: number;
  fixedAt?: string;
}

// State
const activeRepairs = ref<Repair[]>([]);
const repairHistory = ref<Repair[]>([]);
const totalFixed = ref(0);
const mttr = ref(0); // Mean Time To Repair (in minutes)

// API基础URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:9700/api';

// Computed
const successRate = computed(() => {
  const total = repairHistory.value.length;
  if (total === 0) return 100;
  const successful = repairHistory.value.filter(r => r.status === 'completed').length;
  return Math.round((successful / total) * 100);
});

// Methods
const getStatusColor = (status: string): string => {
  const colors = {
    diagnosing: 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-800 dark:text-yellow-400',
    repairing: 'bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-blue-400',
    verifying: 'bg-purple-100 dark:bg-purple-500/20 text-purple-800 dark:text-purple-400',
    completed: 'bg-green-100 dark:bg-green-500/20 text-green-800 dark:text-green-400',
    failed: 'bg-red-100 dark:bg-red-500/20 text-red-800 dark:text-red-400'
  };
  return colors[status as keyof typeof colors] || colors.diagnosing;
};

const getStatusText = (status: string): string => {
  const statusTexts = {
    diagnosing: '诊断中',
    repairing: '修复中',
    verifying: '验证中',
    completed: '已完成',
    failed: '失败'
  };
  return statusTexts[status as keyof typeof statusTexts] || status;
};

const formatTime = (time: string): string => {
  return new Date(time).toLocaleString();
};

const formatDuration = (minutes: number): string => {
  if (minutes < 60) return `${minutes}分钟`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}小时 ${mins}分钟`;
};

const fetchData = async () => {
  try {
    const [activeResponse, historyResponse, statsResponse] = await Promise.all([
      fetch(`${API_BASE_URL}/autoheal/active`),
      fetch(`${API_BASE_URL}/autoheal/history`),
      fetch(`${API_BASE_URL}/autoheal/stats`)
    ]);

    if (!activeResponse.ok || !historyResponse.ok || !statsResponse.ok) {
      throw new Error('Failed to fetch auto-heal data');
    }

    const activeData = await activeResponse.json();
    const historyData = await historyResponse.json();
    const statsData = await statsResponse.json();

    if (activeData.success && historyData.success && statsData.success) {
      activeRepairs.value = activeData.data;
      repairHistory.value = historyData.data;
      totalFixed.value = statsData.data.totalFixed;
      mttr.value = statsData.data.mttr;
    }
  } catch (error) {
    console.error('Error fetching auto-heal data:', error);
    
    // 开发环境下使用模拟数据
    if (import.meta.env.DEV) {
      generateMockData();
    }
  }
};

const generateMockData = () => {
  // Generate mock active repairs
  activeRepairs.value = [
    {
      id: 'repair-1',
      issue: 'CPU使用率过高',
      service: 'API网关',
      status: 'repairing',
      progress: 65,
      startTime: new Date(Date.now() - 15 * 60000).toISOString(),
      eta: new Date(Date.now() + 10 * 60000).toISOString()
    },
    {
      id: 'repair-2',
      issue: '内存泄漏',
      service: '身份验证服务',
      status: 'diagnosing',
      progress: 30,
      startTime: new Date(Date.now() - 5 * 60000).toISOString(),
      eta: new Date(Date.now() + 25 * 60000).toISOString()
    }
  ];

  // Generate mock repair history with proper typing
  repairHistory.value = Array.from({ length: 10 }, (_, i) => ({
    id: `history-${i + 1}`,
    issue: ['数据库连接问题', '内存使用率过高', '服务崩溃', '网络延迟'][Math.floor(Math.random() * 4)],
    service: ['API网关', '身份验证服务', '用户服务', '支付服务'][Math.floor(Math.random() * 4)],
    status: Math.random() > 0.5 ? 'completed' : 'failed' as const,
    progress: 100,
    startTime: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
    eta: new Date(Date.now()).toISOString(),
    duration: Math.floor(Math.random() * 120) + 5,
    fixedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
  }));

  // Generate mock stats
  totalFixed.value = 127;
  mttr.value = 23; // 23 minutes average repair time
};

// Initialize
onMounted(() => {
  fetchData();
  // Refresh data every 30 seconds
  setInterval(fetchData, 30000);
});
</script> 