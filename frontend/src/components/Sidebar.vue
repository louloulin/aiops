<script setup lang="ts">
import { ref } from 'vue';

interface MenuItem {
  id: string;
  label: string;
  icon: string;
  path: string;
}

const menuItems: MenuItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
    path: '/'
  },
  {
    id: 'metrics',
    label: 'Metrics',
    icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
    path: '/metrics'
  },
  {
    id: 'logs',
    label: 'Logs',
    icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    path: '/logs'
  },
  {
    id: 'deployments',
    label: 'Deployments',
    icon: 'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10',
    path: '/deployments'
  },
  {
    id: 'knowledge',
    label: 'Knowledge Base',
    icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
    path: '/knowledge'
  },
  {
    id: 'autoheal',
    label: 'Auto Healing',
    icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
    path: '/autoheal'
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z',
    path: '/settings'
  }
];

const activeItem = ref('dashboard');

const setActiveItem = (id: string) => {
  activeItem.value = id;
};

const isCollapsed = ref(false);

const toggleSidebar = () => {
  isCollapsed.value = !isCollapsed.value;
};
</script>

<template>
  <div class="h-screen flex flex-col bg-white dark:bg-gray-800 shadow-md"
       :class="{ 'w-20': isCollapsed, 'w-64': !isCollapsed }">
    <!-- Logo and Toggle Button -->
    <div class="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-700">
      <div class="flex items-center">
        <span v-if="!isCollapsed" class="text-xl font-bold text-gray-900 dark:text-white">AI OPS</span>
        <span v-else class="text-xl font-bold text-gray-900 dark:text-white">AI</span>
      </div>
      <button @click="toggleSidebar" class="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path v-if="isCollapsed" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
          <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
        </svg>
      </button>
    </div>
    
    <!-- Menu Items -->
    <nav class="flex-1 overflow-y-auto py-4">
      <ul class="space-y-2 px-2">
        <li v-for="item in menuItems" :key="item.id">
          <a :href="item.path"
             @click.prevent="setActiveItem(item.id)"
             class="flex items-center p-2 text-base font-normal rounded-lg transition-colors"
             :class="activeItem === item.id ? 
                    'bg-gray-100 dark:bg-gray-700 text-blue-600 dark:text-blue-400' : 
                    'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              :class="isCollapsed ? 'h-6 w-6 mx-auto' : 'h-6 w-6 mr-3'"
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor" 
              stroke-width="2"
            >
              <path stroke-linecap="round" stroke-linejoin="round" :d="item.icon" />
            </svg>
            <span :class="{ 'hidden': isCollapsed }">{{ item.label }}</span>
          </a>
        </li>
      </ul>
    </nav>
    
    <!-- User Profile -->
    <div class="border-t border-gray-200 dark:border-gray-700 p-4 mt-auto">
      <div class="flex items-center" :class="{ 'justify-center': isCollapsed }">
        <div class="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
          U
        </div>
        <div v-if="!isCollapsed" class="ml-3">
          <p class="text-sm font-medium text-gray-900 dark:text-white">User Name</p>
          <p class="text-xs text-gray-500 dark:text-gray-400">Administrator</p>
        </div>
      </div>
    </div>
  </div>
</template> 