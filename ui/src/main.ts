import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'

// 导入 vue-sonner 替代 vue-toastification
import { Toaster } from 'vue-sonner'
import './sonner.css' // 如果需要自定义样式

// 其他导入语句...

// Initialize theme
const initializeTheme = () => {
  // Check for saved theme preference or use system preference
  const darkMode = localStorage.getItem('darkMode') === 'true' || 
    (localStorage.getItem('darkMode') === null && 
     window.matchMedia('(prefers-color-scheme: dark)').matches);
  
  // Apply theme
  if (darkMode) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  
  // Save preference
  localStorage.setItem('darkMode', darkMode.toString());
};

// Initialize theme before mounting the app
initializeTheme();

// 创建应用并挂载
const app = createApp(App);

// 挂载 Toaster 组件
app.component('Toaster', Toaster);

app.use(router);
app.mount('#app');
