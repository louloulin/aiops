<script setup lang="ts">
import { ref } from 'vue';
import Sidebar from './components/Sidebar.vue';

const darkMode = ref(localStorage.getItem('darkMode') === 'true');
const isFullscreen = ref(false);

const toggleDarkMode = () => {
  darkMode.value = !darkMode.value;
  localStorage.setItem('darkMode', darkMode.value.toString());
  document.documentElement.classList.toggle('dark', darkMode.value);
};

const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(err => {
      console.error(`Error attempting to enable fullscreen: ${err.message}`);
    });
    isFullscreen.value = true;
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
      isFullscreen.value = false;
    }
  }
};

// Listen for fullscreen change events
const handleFullscreenChange = () => {
  isFullscreen.value = !!document.fullscreenElement;
};

// Initialize dark mode
if (darkMode.value) {
  document.documentElement.classList.add('dark');
}

// Add fullscreen change event listener
document.addEventListener('fullscreenchange', handleFullscreenChange);
</script>

<template>
  <div :class="{ 'dark': darkMode }" class="min-h-screen h-screen w-screen bg-[#1C1C1C] dark:bg-[#1C1C1C] text-gray-200 overflow-hidden">
    <div class="flex h-full w-full overflow-hidden">
      <!-- Sidebar -->
      <Sidebar />
      
      <!-- Content Area -->
      <div class="flex-1 flex flex-col overflow-hidden">
        <!-- Header -->
        <header class="bg-[#1C1C1C] border-b border-gray-800">
          <div class="px-4">
            <div class="flex justify-between h-16">
              <div class="flex items-center">
                <h1 class="text-2xl font-bold text-white">AI OPS</h1>
              </div>
              <div class="flex items-center space-x-2">
                <!-- Status pill indicators, mimicking Supabase -->
                <div class="flex space-x-2 mr-4">
                  <div class="flex items-center">
                    <div class="h-2 w-2 rounded-full bg-emerald-500 mr-2"></div>
                    <span class="text-xs text-gray-400">Project Status</span>
                  </div>
                  <div class="flex items-center">
                    <div class="h-2 w-2 rounded-full bg-red-500 mr-2"></div>
                    <span class="text-xs text-gray-400">Security Issues</span>
                  </div>
                </div>
                
                <button @click="toggleFullscreen" class="p-2 rounded-md hover:bg-gray-800" title="Toggle Fullscreen">
                  <svg v-if="isFullscreen" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
                  </svg>
                </button>
                <button @click="toggleDarkMode" class="p-2 rounded-md hover:bg-gray-800" title="Toggle Dark Mode">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </header>
        
        <!-- Main Content -->
        <main class="flex-1 overflow-auto py-6 px-6">
          <router-view></router-view>
        </main>
        
        <!-- Footer -->
        <footer class="bg-[#1C1C1C] border-t border-gray-800 py-3">
          <div class="px-6">
            <div class="text-center text-xs text-gray-500">
              AI OPS Platform &copy; {{ new Date().getFullYear() }}
            </div>
          </div>
        </footer>
      </div>
    </div>
  </div>
</template>

<style>
:root {
  color-scheme: dark;
}

html, body {
  margin: 0;
  padding: 0;
  height: 100%;
  width: 100%;
  overflow: hidden;
}

body {
  font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Supabase specific styles */
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}

.supabase-card {
  @apply bg-[#212121] rounded-md border border-gray-800;
}

.supabase-button {
  @apply px-4 py-2 rounded bg-[#3ecf8e] text-white hover:bg-[#38b97c] transition-colors;
}

.supabase-button-secondary {
  @apply px-4 py-2 rounded bg-[#212121] text-white border border-gray-700 hover:bg-[#2a2a2a] transition-colors;
}

/* Custom scrollbar like Supabase */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #1c1c1c;
}

::-webkit-scrollbar-thumb {
  background: #333;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #444;
}
</style>
