<script setup lang="ts">
import { ref } from 'vue';
import Dashboard from './components/Dashboard.vue';
import Sidebar from './components/Sidebar.vue';

const darkMode = ref(localStorage.getItem('darkMode') === 'true');

const toggleDarkMode = () => {
  darkMode.value = !darkMode.value;
  localStorage.setItem('darkMode', darkMode.value.toString());
  document.documentElement.classList.toggle('dark', darkMode.value);
};

// Initialize dark mode
if (darkMode.value) {
  document.documentElement.classList.add('dark');
}
</script>

<template>
  <div :class="{ 'dark': darkMode }" class="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
    <div class="flex h-screen overflow-hidden">
      <!-- Sidebar -->
      <Sidebar />
      
      <!-- Content Area -->
      <div class="flex-1 flex flex-col overflow-hidden">
        <!-- Header -->
        <header class="bg-white dark:bg-gray-800 shadow-sm">
          <div class="px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between h-16">
              <div class="flex items-center">
                <h1 class="text-2xl font-bold">AI OPS</h1>
              </div>
              <div class="flex items-center">
                <button @click="toggleDarkMode" class="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
                  <svg v-if="darkMode" xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </header>
        
        <!-- Main Content -->
        <main class="flex-1 overflow-auto py-6 px-4 sm:px-6 lg:px-8">
          <Dashboard />
        </main>
        
        <!-- Footer -->
        <footer class="bg-white dark:bg-gray-800 py-4">
          <div class="px-4 sm:px-6 lg:px-8">
            <div class="text-center text-sm text-gray-500 dark:text-gray-400">
              AI OPS Platform &copy; {{ new Date().getFullYear() }}
            </div>
          </div>
        </footer>
      </div>
    </div>
  </div>
</template>

<style scoped>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
