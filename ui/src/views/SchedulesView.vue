<template>
  <div class="container mx-auto px-4 py-8">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">计划任务管理</h1>
    </div>

    <!-- 任务列表 -->
    <div class="bg-white rounded-lg shadow">
      <div class="p-4 border-b border-gray-200">
        <h2 class="text-lg font-semibold">系统计划任务 ({{ tasks.length }})</h2>
      </div>
      
      <div v-if="loading" class="flex justify-center items-center p-8">
        <div class="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
      </div>
      
      <div v-else-if="tasks.length === 0" class="p-8 text-center text-gray-500">
        没有计划任务
      </div>
      
      <div v-else class="divide-y divide-gray-200">
        <div v-for="task in tasks" :key="task.id" class="p-4">
          <div class="flex flex-col md:flex-row md:items-center md:justify-between">
            <div class="mb-4 md:mb-0">
              <h3 class="text-lg font-medium text-gray-900">{{ task.name }}</h3>
              <p class="text-sm text-gray-500">{{ task.description }}</p>
              <div class="mt-1 flex items-center">
                <span class="text-xs font-medium mr-2">ID: {{ task.id }}</span>
                <span :class="getStatusBadgeClass(task.isEnabled)" class="px-2 py-0.5 text-xs rounded-full">
                  {{ task.isEnabled ? '已启用' : '已禁用' }}
                </span>
              </div>
            </div>
            
            <div class="flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-2">
              <button 
                v-if="!task.isEnabled"
                class="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600"
                @click="startTask(task.id)" 
                :disabled="actionLoading">
                启动
              </button>
              <button 
                v-else
                class="px-3 py-1 bg-yellow-500 text-white text-sm rounded hover:bg-yellow-600"
                @click="stopTask(task.id)" 
                :disabled="actionLoading">
                停止
              </button>
              <button 
                class="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                @click="triggerTask(task.id)" 
                :disabled="actionLoading">
                立即执行
              </button>
              <button 
                class="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600"
                @click="showEditCronModal(task)" 
                :disabled="actionLoading">
                修改计划
              </button>
            </div>
          </div>
          
          <div class="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span class="font-medium text-gray-500">Cron 表达式:</span>
              <span class="ml-2 font-mono">{{ task.cronExpression }}</span>
            </div>
            <div>
              <span class="font-medium text-gray-500">下次执行时间:</span>
              <span class="ml-2">{{ formatDateTime(task.nextRunTime) }}</span>
            </div>
            <div v-if="task.lastRun">
              <span class="font-medium text-gray-500">上次执行时间:</span>
              <span class="ml-2">{{ formatDateTime(task.lastRun) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 编辑Cron表达式的模态框 -->
    <div v-if="showCronModal" class="fixed inset-0 flex items-center justify-center z-50">
      <div class="fixed inset-0 bg-black bg-opacity-50" @click="showCronModal = false"></div>
      <div class="bg-white rounded-lg shadow-lg p-6 max-w-md w-full relative z-10">
        <h2 class="text-xl font-semibold mb-4">修改计划任务</h2>
        <p class="mb-4 text-gray-600">{{ selectedTask?.name }}</p>
        
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-1">Cron 表达式</label>
          <input 
            v-model="cronExpression" 
            class="w-full rounded border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="例如: */5 * * * *"
          />
          <p class="mt-1 text-xs text-gray-500">
            格式: 分钟 小时 日期 月份 星期<br>
            例子: */5 * * * * (每5分钟), 0 */1 * * * (每小时), 0 0 * * * (每天午夜)
          </p>
        </div>
        
        <div class="flex justify-end space-x-3">
          <button 
            class="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
            @click="showCronModal = false">
            取消
          </button>
          <button 
            class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            @click="updateTaskSchedule" 
            :disabled="actionLoading">
            保存
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { API_BASE_URL } from '../config';

// 状态
const loading = ref(false);
const actionLoading = ref(false);
const tasks = ref<any[]>([]);
const refreshInterval = ref<number | null>(null);
const showCronModal = ref(false);
const selectedTask = ref<any>(null);
const cronExpression = ref('');

// 获取任务数据
const fetchTasks = async () => {
  loading.value = true;
  try {
    const response = await fetch(`${API_BASE_URL}/schedules`);
    const data = await response.json();
    
    if (data.success) {
      tasks.value = data.tasks;
    } else {
      console.error('获取计划任务失败:', data.error);
    }
  } catch (error) {
    console.error('获取计划任务错误:', error);
  } finally {
    loading.value = false;
  }
};

// 启动任务
const startTask = async (taskId: string) => {
  actionLoading.value = true;
  try {
    const response = await fetch(`${API_BASE_URL}/schedules/${taskId}/start`, {
      method: 'POST'
    });
    const data = await response.json();
    
    if (data.success) {
      console.log('任务已启动');
      // 更新任务状态
      const task = tasks.value.find(t => t.id === taskId);
      if (task) {
        task.isEnabled = true;
      }
    } else {
      console.error('启动任务失败:', data.error);
    }
  } catch (error) {
    console.error('启动任务错误:', error);
  } finally {
    actionLoading.value = false;
  }
};

// 停止任务
const stopTask = async (taskId: string) => {
  actionLoading.value = true;
  try {
    const response = await fetch(`${API_BASE_URL}/schedules/${taskId}/stop`, {
      method: 'POST'
    });
    const data = await response.json();
    
    if (data.success) {
      console.log('任务已停止');
      // 更新任务状态
      const task = tasks.value.find(t => t.id === taskId);
      if (task) {
        task.isEnabled = false;
      }
    } else {
      console.error('停止任务失败:', data.error);
    }
  } catch (error) {
    console.error('停止任务错误:', error);
  } finally {
    actionLoading.value = false;
  }
};

// 手动触发任务
const triggerTask = async (taskId: string) => {
  actionLoading.value = true;
  try {
    const response = await fetch(`${API_BASE_URL}/schedules/${taskId}/trigger`, {
      method: 'POST'
    });
    const data = await response.json();
    
    if (data.success) {
      console.log('任务已触发');
      // 立即刷新任务列表
      fetchTasks();
    } else {
      console.error('触发任务失败:', data.error);
    }
  } catch (error) {
    console.error('触发任务错误:', error);
  } finally {
    actionLoading.value = false;
  }
};

// 显示编辑Cron表达式的模态框
const showEditCronModal = (task: any) => {
  selectedTask.value = task;
  cronExpression.value = task.cronExpression;
  showCronModal.value = true;
};

// 更新任务的Cron表达式
const updateTaskSchedule = async () => {
  if (!selectedTask.value || !cronExpression.value) return;
  
  actionLoading.value = true;
  try {
    const response = await fetch(`${API_BASE_URL}/schedules/${selectedTask.value.id}/cron`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        cronExpression: cronExpression.value
      })
    });
    const data = await response.json();
    
    if (data.success) {
      console.log('任务计划已更新');
      // 关闭模态框
      showCronModal.value = false;
      // 更新任务
      fetchTasks();
    } else {
      console.error('更新任务计划失败:', data.error);
    }
  } catch (error) {
    console.error('更新任务计划错误:', error);
  } finally {
    actionLoading.value = false;
  }
};

// 获取状态样式类
const getStatusBadgeClass = (isEnabled: boolean) => {
  return isEnabled 
    ? 'bg-green-100 text-green-800' 
    : 'bg-gray-100 text-gray-800';
};

// 格式化日期时间
const formatDateTime = (dateStr: string | Date) => {
  if (!dateStr) return '未知';
  
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).format(date);
};

// 自动刷新
const startAutoRefresh = () => {
  refreshInterval.value = window.setInterval(() => {
    fetchTasks();
  }, 60000); // 每分钟刷新一次
};

// 生命周期钩子
onMounted(() => {
  fetchTasks();
  startAutoRefresh();
});

onUnmounted(() => {
  if (refreshInterval.value !== null) {
    clearInterval(refreshInterval.value);
  }
});
</script> 