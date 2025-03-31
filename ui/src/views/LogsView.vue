<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import debounce from 'lodash/debounce';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import LogsAnalytics from '../components/logs/LogsAnalytics.vue';
import { Suspense } from 'vue';

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
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">日志管理</h1>
    </div>
    
    <Tabs v-model="activeTab" class="w-full">
      <TabsList class="mb-4">
        <TabsTrigger value="logs" class="text-gray-700 dark:text-gray-300">日志查询</TabsTrigger>
        <TabsTrigger value="analytics" class="text-gray-700 dark:text-gray-300">日志分析</TabsTrigger>
      </TabsList>
      
      <TabsContent value="logs" class="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle class="text-gray-900 dark:text-white">日志筛选</CardTitle>
            <CardDescription class="text-gray-600 dark:text-gray-400">使用下面的选项筛选日志</CardDescription>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="flex flex-col md:flex-row gap-4">
              <div class="w-full md:w-1/3">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">搜索</label>
                <Input 
                  v-model="searchQuery" 
                  placeholder="搜索日志消息..." 
                  class="bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
              
              <div class="w-full md:w-1/3">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">日志级别</label>
                <Select 
                  v-model="selectedLogLevels" 
                  multiple
                  class="w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <SelectTrigger class="w-full">
                    <SelectValue placeholder="选择级别" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem 
                      v-for="level in logLevels" 
                      :key="level.value" 
                      :value="level.value"
                    >
                      <div class="flex items-center">
                        <span :class="level.color" class="h-3 w-3 rounded-full mr-2"></span>
                        <span>{{ level.label }}</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div class="w-full md:w-1/3">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">服务</label>
                <Select 
                  v-model="selectedServices" 
                  multiple
                  class="w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <SelectTrigger class="w-full">
                    <SelectValue placeholder="选择服务" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem 
                      v-for="service in services" 
                      :key="service.value" 
                      :value="service.value"
                    >
                      {{ service.label }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div class="flex flex-col md:flex-row gap-4">
              <div class="w-full md:w-1/3">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">时间范围</label>
                <Select 
                  v-model="selectedTimeRange"
                  class="w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <SelectTrigger class="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem 
                      v-for="range in timeRanges" 
                      :key="range.value" 
                      :value="range.value"
                    >
                      {{ range.label }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div class="w-full md:w-2/3 flex items-end space-x-3">
                <Button 
                  @click="refreshLogs" 
                  variant="outline"
                  class="text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700"
                >
                  <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                  </svg>
                  刷新
                </Button>
                
                <Button 
                  @click="analyzeLogs" 
                  variant="outline"
                  class="text-blue-600 dark:text-blue-400 border-blue-300 dark:border-blue-800"
                >
                  <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                  </svg>
                  分析模式
                </Button>
                
                <Button 
                  @click="exportLogs" 
                  variant="outline"
                  class="text-green-600 dark:text-green-400 border-green-300 dark:border-green-800"
                >
                  <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                  </svg>
                  导出
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <div v-if="isLoading" class="animate-pulse space-y-4 mt-4">
          <div class="h-10 bg-gray-200 dark:bg-gray-800 rounded w-full"></div>
          <div class="h-10 bg-gray-200 dark:bg-gray-800 rounded w-full"></div>
          <div class="h-10 bg-gray-200 dark:bg-gray-800 rounded w-full"></div>
          <div class="h-10 bg-gray-200 dark:bg-gray-800 rounded w-full"></div>
          <div class="h-10 bg-gray-200 dark:bg-gray-800 rounded w-full"></div>
        </div>
        
        <div v-else-if="filteredLogs.length === 0" class="bg-white dark:bg-[#212121] rounded-lg p-8 text-center border border-gray-200 dark:border-gray-800 mt-4">
          <svg class="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
          <h2 class="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">没有符合条件的日志</h2>
          <p class="text-gray-500 dark:text-gray-400">尝试更改筛选条件或时间范围以查看更多日志。</p>
        </div>
        
        <div v-else class="bg-white dark:bg-[#212121] rounded-lg shadow overflow-x-auto border border-gray-200 dark:border-gray-800">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
            <thead class="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">时间</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">级别</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">服务</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">消息</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-[#212121] divide-y divide-gray-200 dark:divide-gray-800">
              <tr v-for="log in filteredLogs" :key="log.id" class="hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {{ formatTimestamp(log.timestamp) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full" :class="getLogLevelStyle(log.level)">
                    {{ log.level.toUpperCase() }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {{ log.service }}
                </td>
                <td class="px-6 py-4 text-sm text-gray-900 dark:text-white">
                  {{ log.message }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm">
                  <button class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">
                    详情
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div class="flex justify-between items-center mt-4">
          <div class="text-sm text-gray-700 dark:text-gray-300">
            显示 <span class="font-medium">{{ filteredLogs.length }}</span> 条日志记录
          </div>
          
          <div class="flex space-x-2">
            <Button 
              variant="outline"
              class="text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700"
              disabled
            >
              上一页
            </Button>
            <Button 
              variant="outline"
              class="text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700"
              disabled
            >
              下一页
            </Button>
          </div>
        </div>
      </TabsContent>
      
      <TabsContent value="analytics">
        <Suspense>
          <LogsAnalytics />
          <template #fallback>
            <div class="animate-pulse space-y-4">
              <div class="h-40 bg-gray-200 dark:bg-gray-800 rounded w-full"></div>
              <div class="h-60 bg-gray-200 dark:bg-gray-800 rounded w-full"></div>
            </div>
          </template>
        </Suspense>
      </TabsContent>
    </Tabs>
    
    <div 
      v-if="showAnalysis" 
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
    >
      <div class="bg-white dark:bg-[#212121] rounded-lg shadow-xl w-full max-w-2xl overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">日志分析结果</h3>
          <button 
            @click="showAnalysis = false"
            class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        
        <div class="p-6">
          <h4 class="font-medium text-gray-900 dark:text-white mb-2">检测到的异常</h4>
          <ul class="mb-4 space-y-2">
            <li 
              v-for="(anomaly, index) in analysisResults?.anomalies" 
              :key="index"
              class="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 p-2 rounded-md text-sm"
            >
              {{ anomaly.service }} 服务的 {{ anomaly.metric }} 指标出现{{ anomaly.type === 'spike' ? '峰值' : '异常模式' }} (置信度: {{ (anomaly.confidence * 100).toFixed(0) }}%)
            </li>
          </ul>
          
          <h4 class="font-medium text-gray-900 dark:text-white mb-2">洞察分析</h4>
          <ul class="mb-4 space-y-1 list-disc pl-5 text-gray-600 dark:text-gray-300 text-sm">
            <li v-for="(insight, index) in analysisResults?.insights" :key="index">
              {{ insight }}
            </li>
          </ul>
          
          <h4 class="font-medium text-gray-900 dark:text-white mb-2">建议操作</h4>
          <ul class="space-y-1 list-disc pl-5 text-gray-600 dark:text-gray-300 text-sm">
            <li v-for="(action, index) in analysisResults?.suggestedActions" :key="index">
              {{ action }}
            </li>
          </ul>
        </div>
        
        <div class="px-6 py-3 bg-gray-50 dark:bg-gray-900 flex justify-end">
          <Button @click="showAnalysis = false">关闭</Button>
        </div>
      </div>
    </div>
  </div>
</template> 