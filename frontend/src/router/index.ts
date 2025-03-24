import { createRouter, createWebHistory } from 'vue-router';
import Dashboard from '../components/Dashboard.vue';

const routes = [
  {
    path: '/',
    name: 'Dashboard',
    component: Dashboard,
  },
  {
    path: '/metrics',
    name: 'Metrics',
    component: () => import('../views/MetricsView.vue'),
  },
  {
    path: '/logs',
    name: 'Logs',
    component: () => import('../views/LogsView.vue'),
  },
  {
    path: '/deployments',
    name: 'Deployments',
    component: () => import('../views/DeploymentsView.vue'),
  },
  {
    path: '/knowledge',
    name: 'Knowledge',
    component: () => import('../views/KnowledgeView.vue'),
  },
  {
    path: '/autoheal',
    name: 'AutoHeal',
    component: () => import('../views/AutoHealView.vue'),
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('../views/SettingsView.vue'),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router; 