<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import debounce from 'lodash/debounce';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import LogsAnalytics from '../components/logs/LogsAnalytics.vue';

// 日志级别选项
const logLevels = [
  { value: 'error', label: 'Error', color: 'bg-red-500' },
  { value: 'warn', label: 'Warning', color: 'bg-yellow-500' },
  { value: 'info', label: 'Info', color: 'bg-blue-500' },
  { value: 'debug', label: 'Debug', color: 'bg-gray-500' },
];

// 服务选项
const services = [
  { value: 'api-gateway', label: 'API Gateway' },
  { value: 'auth-service', label: 'Auth Service' },
  { value: 'user-service', label: 'User Service' },
  { value: 'database-service', label: 'Database Service' },
  { value: 'notification-service', label: 'Notification Service' },
  { value: 'payment-service', label: 'Payment Service' },
];

// 时间范围选项
const timeRanges = [
  { value: '15m', label: '15 分钟' },
  { value: '1h', label: '1 小时' },
  { value: '3h', label: '3 小时' },
  { value: '6h', label: '6 小时' },
  { value: '12h', label: '12 小时' },
  { value: '24h', label: '24 小时' },
  { value: '3d', label: '3 天' },
  { value: '7d', label: '7 天' },
];

// 状态
const searchQuery = ref('');
const selectedLogLevels = ref(['error', 'warn', 'info']); // 默认选中错误、警告和信息
const selectedServices = ref<string[]>([]);
const selectedTimeRange = ref('24h');
const activeTab = ref('logs');
const isLoading = ref(false);
const showAnalysis = ref(false);
const analysisResults = ref<any>(null);

// 模拟日志数据
const logs = ref([
  {
    id: 'log-001',
    timestamp: '2023-11-20T09:15:32Z',
    level: 'error',
    service: 'api-gateway',
    message: 'Failed to connect to auth-service: Connection refused',
    context: { requestId: 'req-1234', endpoint: '/api/users', method: 'GET' }
  },
  {
    id: 'log-002',
    timestamp: '2023-11-20T09:15:45Z',
    level: 'error',
    service: 'api-gateway',
    message: 'Timeout waiting for response from auth-service',
    context: { requestId: 'req-1235', endpoint: '/api/metrics', method: 'GET' }
  },
  {
    id: 'log-003',
    timestamp: '2023-11-20T09:16:12Z',
    level: 'warn',
    service: 'user-service',
    message: 'User rate limit approaching threshold',
    context: { userId: 'user-567', requestsPerMinute: 48, limit: 50 }
  },
  {
    id: 'log-004',
    timestamp: '2023-11-20T09:18:23Z',
    level: 'info',
    service: 'notification-service',
    message: 'Successfully sent 156 push notifications',
    context: { batchId: 'batch-789', successful: 156, failed: 3 }
  },
  {
    id: 'log-005',
    timestamp: '2023-11-20T09:22:56Z',
    level: 'debug',
    service: 'database-service',
    message: 'Query execution plan: INDEX SCAN on users_email_idx',
    context: { queryId: 'q-987', executionTime: '45ms', rowsReturned: 1 }
  },
  {
    id: 'log-006',
    timestamp: '2023-11-20T09:25:34Z',
    level: 'info',
    service: 'auth-service',
    message: 'User login successful',
    context: { userId: 'user-321', ipAddress: '192.168.1.42', device: 'Desktop' }
  },
  {
    id: 'log-007',
    timestamp: '2023-11-20T09:28:17Z',
    level: 'warn',
    service: 'database-service',
    message: 'Slow query detected (765ms)',
    context: { queryId: 'q-988', threshold: '500ms', table: 'user_transactions' }
  },
  {
    id: 'log-008',
    timestamp: '2023-11-20T09:30:02Z',
    level: 'info',
    service: 'api-gateway',
    message: 'API rate limiting applied',
    context: { clientId: 'client-456', endpoint: '/api/reports', limit: '100/min' }
  },
  {
    id: 'log-009',
    timestamp: '2023-11-20T09:32:45Z',
    level: 'error',
    service: 'payment-service',
    message: 'Payment processing failed: Invalid card number',
    context: { paymentId: 'pmt-654', provider: 'stripe', errorCode: 'INVALID_CARD' }
  },
  {
    id: 'log-010',
    timestamp: '2023-11-20T09:35:21Z',
    level: 'info',
    service: 'user-service',
    message: 'User profile updated successfully',
    context: { userId: 'user-789', fields: ['email', 'name', 'preferences'] }
  },
]);

// 根据筛选条件过滤日志
const filteredLogs = computed(() => {
  return logs.value.filter(log => {
    // 检查是否匹配选定的日志级别
    if (selectedLogLevels.value.length && !selectedLogLevels.value.includes(log.level)) {
      return false;
    }
    
    // 检查是否匹配选定的服务
    if (selectedServices.value.length && !selectedServices.value.includes(log.service)) {
      return false;
    }
    
    // 检查是否匹配搜索查询
    if (searchQuery.value && !log.message.toLowerCase().includes(searchQuery.value.toLowerCase())) {
      return false;
    }
    
    return true;
  });
});

// 日志级别徽章样式
const getLogLevelStyle = (level: string) => {
  switch(level) {
    case 'error':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    case 'warn':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    case 'info':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'debug':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
  }
};

// 格式化时间
const formatTimestamp = (timestamp: string) => {
  return new Date(timestamp).toLocaleString();
};

// 搜索处理函数
const debouncedSearch = debounce(() => {
  // 实际应用中，这里可能会调用API来获取日志
  console.log('Searching logs with query:', searchQuery.value);
}, 300);

// 监听搜索查询变化
watch(searchQuery, () => {
  debouncedSearch();
});

// 获取日志数据
const fetchLogs = () => {
  isLoading.value = true;
  // 模拟API调用延迟
  setTimeout(() => {
    // 实际应用中，这里会从API获取日志数据
    isLoading.value = false;
  }, 800);
};

// 分析日志
const analyzeLogs = () => {
  isLoading.value = true;
  // 模拟API调用延迟
  setTimeout(() => {
    // 模拟分析结果
    analysisResults.value = {
      anomalies: [
        { type: 'spike', metric: 'errors', service: 'api-gateway', confidence: 0.92 },
        { type: 'pattern', metric: 'latency', service: 'database-service', confidence: 0.85 }
      ],
      insights: [
        'API Gateway 错误率在过去 30 分钟内增加了 300%',
        '数据库服务的查询延迟在高峰时段呈现周期性增长',
        '身份验证服务在 9:15-9:35 期间出现连续失败现象'
      ],
      suggestedActions: [
        '检查 API Gateway 与身份验证服务之间的连接状态',
        '考虑提高数据库连接池大小以应对高峰期查询',
        '审查最近部署的代码更改可能影响了身份验证服务'
      ]
    };
    showAnalysis.value = true;
    isLoading.value = false;
  }, 1500);
};

// 刷新日志
const refreshLogs = () => {
  fetchLogs();
};

// 导出日志
const exportLogs = () => {
  // 实际应用中，这里会实现导出功能
  alert('导出功能将在此实现');
};

// 组件挂载时获取日志
onMounted(() => {
  fetchLogs();
});
</script>

<template>
  <div class="container mx-auto p-4 space-y-6">
    <div class="flex justify-between items-center">
      <h1 class="text-2xl font-bold">日志管理</h1>
      
      <div class="flex space-x-2">
        <Tabs v-model="activeTab" class="w-auto">
          <TabsList>
            <TabsTrigger value="logs">日志列表</TabsTrigger>
            <TabsTrigger value="analytics">日志分析</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </div>
    
    <TabsContent value="logs" class="mt-0">
      <!-- 筛选控件 -->
      <div class="flex flex-col md:flex-row gap-4 mb-6">
        <div class="flex-1">
          <Input v-model="searchQuery" placeholder="搜索日志..." />
        </div>
        
        <div class="flex flex-col sm:flex-row gap-2">
          <Select v-model="selectedTimeRange">
            <SelectTrigger class="w-[140px]">
              <SelectValue placeholder="选择时间范围" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="range in timeRanges" :key="range.value" :value="range.value">
                {{ range.label }}
              </SelectItem>
            </SelectContent>
          </Select>
          
          <Button @click="refreshLogs">刷新</Button>
          <Button @click="analyzeLogs" :disabled="isLoading">分析</Button>
          <Button variant="outline" @click="exportLogs">导出</Button>
        </div>
      </div>
      
      <!-- 筛选标签 -->
      <div class="flex flex-wrap gap-2 mb-6">
        <div class="flex flex-wrap gap-2 mr-4">
          <div v-for="level in logLevels" :key="level.value" class="flex items-center">
            <label class="inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                :value="level.value" 
                v-model="selectedLogLevels"
                class="sr-only"
              />
              <span 
                class="px-2 py-1 text-xs font-medium rounded flex items-center mr-2"
                :class="selectedLogLevels.includes(level.value) ? getLogLevelStyle(level.value) : 'bg-gray-100 text-gray-500'"
              >
                <span :class="level.color" class="w-2 h-2 rounded-full mr-1.5"></span>
                {{ level.label }}
              </span>
            </label>
          </div>
        </div>
        
        <div class="flex flex-wrap gap-2">
          <div v-for="service in services" :key="service.value" class="flex items-center">
            <label class="inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                :value="service.value" 
                v-model="selectedServices"
                class="sr-only"
              />
              <span 
                class="px-2 py-1 text-xs font-medium rounded flex items-center mr-2"
                :class="selectedServices.includes(service.value) ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' : 'bg-gray-100 text-gray-500'"
              >
                {{ service.label }}
              </span>
            </label>
          </div>
        </div>
      </div>
      
      <!-- 日志表格 -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="bg-gray-50 dark:bg-gray-700 border-b dark:border-gray-600">
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">时间</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">级别</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">服务</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">消息</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              <tr v-for="log in filteredLogs" :key="log.id" class="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td class="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  {{ formatTimestamp(log.timestamp) }}
                </td>
                <td class="px-4 py-3 text-sm whitespace-nowrap">
                  <span :class="getLogLevelStyle(log.level)" class="px-2 py-1 text-xs font-medium rounded">
                    {{ log.level.toUpperCase() }}
                  </span>
                </td>
                <td class="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                  {{ log.service }}
                </td>
                <td class="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                  <div class="flex flex-col">
                    <span class="font-medium text-gray-900 dark:text-white">{{ log.message }}</span>
                    <span class="text-xs text-gray-500">
                      {{ JSON.stringify(log.context) }}
                    </span>
                  </div>
                </td>
              </tr>
              
              <tr v-if="filteredLogs.length === 0" class="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td colspan="4" class="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center">
                  未找到符合条件的日志
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      <!-- 日志分析结果卡片 -->
      <div v-if="showAnalysis" class="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>日志分析结果</CardTitle>
            <CardDescription>
              AI 系统对当前筛选日志的分析
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div class="space-y-6">
              <!-- 异常检测 -->
              <div>
                <h3 class="text-lg font-medium mb-2">检测到的异常</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div 
                    v-for="(anomaly, index) in analysisResults.anomalies" 
                    :key="index"
                    class="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg"
                  >
                    <div class="font-medium text-red-800 dark:text-red-300 mb-1">
                      {{ anomaly.type === 'spike' ? '异常峰值' : '异常模式' }}: {{ anomaly.service }}
                    </div>
                    <div class="text-sm text-red-700 dark:text-red-400">
                      {{ anomaly.metric === 'errors' ? '错误率异常' : '延迟异常' }}
                      (置信度: {{ Math.round(anomaly.confidence * 100) }}%)
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- 洞察 -->
              <div>
                <h3 class="text-lg font-medium mb-2">洞察</h3>
                <ul class="list-disc list-inside space-y-2">
                  <li v-for="(insight, index) in analysisResults.insights" :key="index" class="text-gray-700 dark:text-gray-300">
                    {{ insight }}
                  </li>
                </ul>
              </div>
              
              <!-- 建议操作 -->
              <div>
                <h3 class="text-lg font-medium mb-2">建议操作</h3>
                <ul class="list-disc list-inside space-y-2">
                  <li v-for="(action, index) in analysisResults.suggestedActions" :key="index" class="text-gray-700 dark:text-gray-300">
                    {{ action }}
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" @click="showAnalysis = false">关闭分析</Button>
            <Button class="ml-2">创建事件</Button>
          </CardFooter>
        </Card>
      </div>
    </TabsContent>
    
    <TabsContent value="analytics" class="mt-0">
      <LogsAnalytics :timeRange="selectedTimeRange" />
    </TabsContent>
  </div>
</template> 