<template>
  <div class="min-h-screen bg-gray-900 text-white">
    <header class="bg-gray-800 shadow-md">
      <div class="container mx-auto p-4 flex justify-between items-center">
        <div class="flex items-center">
          <div class="mr-4 text-xl font-bold text-blue-500">AI OPS</div>
          <nav class="hidden md:flex space-x-6">
            <router-link 
              v-for="route in mainRoutes" 
              :key="route.name" 
              :to="route.path"
              class="text-sm text-gray-300 hover:text-white px-2 py-1 rounded transition"
              :class="{ 'bg-blue-600 text-white': isActive(route.path) }"
            >
              <span class="material-icons-outlined text-sm mr-1">{{ route.meta?.icon }}</span>
              {{ route.meta?.title }}
            </router-link>
          </nav>
        </div>
        <div class="flex items-center space-x-4">
          <button class="p-2 rounded-full hover:bg-gray-700">
            <span class="material-icons-outlined">notifications</span>
          </button>
          <button class="p-2 rounded-full hover:bg-gray-700">
            <span class="material-icons-outlined">settings</span>
          </button>
          <div class="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
            <span class="material-icons-outlined text-sm">person</span>
          </div>
        </div>
      </div>
    </header>
    
    <main class="container mx-auto p-4">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

// 获取主要路由
const mainRoutes = computed(() => {
  return router.options.routes[0].children?.filter(r => !r.meta?.hideInMenu) || [];
});

// 检查当前路由是否激活
const isActive = (path: string) => {
  if (path === '/') return route.path === '/';
  return route.path.startsWith(path);
};
</script> 