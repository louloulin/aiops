import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'

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

createApp(App)
  .use(router)
  .mount('#app')
