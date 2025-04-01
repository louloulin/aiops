<script setup lang="ts">
import { ref, provide, reactive, watchEffect } from 'vue';
import { useRoute } from 'vue-router';
import Sidebar from './components/Sidebar.vue';
import { Toaster } from 'vue-sonner';
import FloatingChatButton from './components/chat/FloatingChatButton.vue';

const darkMode = ref(localStorage.getItem('darkMode') === 'true');
const route = useRoute();

// 创建全局状态对象
const globalState = reactive({
  // 基本路由信息
  currentRoute: route.path,
  currentView: route.name,
  
  // 用户交互状态
  activeComponent: null as string | null,
  selectedData: null as any,
  activeFilters: {} as Record<string, any>,
  
  // 应用状态标志
  isLoading: false,
  lastError: null as string | null,
  
  // 更新当前活动组件方法
  setActiveComponent(id: string) {
    this.activeComponent = id;
  },
  
  // 更新选择数据方法
  setSelectedData(data: any) {
    this.selectedData = data;
  },
  
  // 更新过滤器方法
  setFilter(componentId: string, filter: any) {
    this.activeFilters[componentId] = filter;
  }
});

// 监听路由变化，更新全局状态
watchEffect(() => {
  globalState.currentRoute = route.path;
  globalState.currentView = route.name;
});

// 提供全局状态给所有组件
provide('globalState', globalState);

// 切换暗黑模式
function toggleDarkMode() {
  darkMode.value = !darkMode.value;
  localStorage.setItem('darkMode', darkMode.value.toString());
  document.documentElement.classList.toggle('dark', darkMode.value);
}

// 初始化暗黑模式
document.documentElement.classList.toggle('dark', darkMode.value);
</script>

<template>
  <div class="app-container" :class="{ dark: darkMode }">
    <div class="app-layout">
      <Sidebar @toggle-dark-mode="toggleDarkMode" :dark-mode="darkMode" />
      <div class="content">
        <router-view />
      </div>
      <FloatingChatButton />
      <!-- 添加 Toaster 组件 -->
      <Toaster richColors />
    </div>
  </div>
</template>

<style scoped>
.app-container {
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}

.app-layout {
  display: flex;
  height: 100%;
}

.content {
  flex: 1;
  overflow-y: auto;
  background-color: var(--background-color, #f4f6f8);
}

:global(.dark) {
  --background-color: #121212;
  --text-color: #ffffff;
}
</style>
