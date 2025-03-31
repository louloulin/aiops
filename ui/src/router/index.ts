import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  {
    path: '/',
    name: 'Dashboard',
    component: () => import('../views/DashboardView.vue'),
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
    path: '/datasources',
    name: 'DataSources',
    component: () => import('../views/DataSourcesView.vue'),
  },
  {
    path: '/business-metrics',
    name: 'BusinessMetrics',
    component: () => import('../views/BusinessMetricsView.vue'),
  },
  {
    path: '/dashboards',
    name: 'Dashboards',
    component: () => import('../views/DashboardsView.vue'),
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