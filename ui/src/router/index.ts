import { createRouter, createWebHistory } from 'vue-router';
import AppLayout from '@/layouts/AppLayout.vue';

// 业务指标相关路由
const businessMetricsRoutes = [
  {
    path: 'business-metrics',
    name: 'BusinessMetrics',
    component: () => import('@/views/business/BusinessMetricsView.vue'),
    meta: {
      title: '业务指标',
      icon: 'chart-line',
      requiresAuth: true,
    },
  },
  {
    path: 'business-metrics/:id',
    name: 'BusinessMetricDetails',
    component: () => import('@/views/business/BusinessMetricDetailsView.vue'),
    props: true,
    meta: {
      title: '指标详情',
      hideInMenu: true,
      requiresAuth: true,
    },
  },
  {
    path: 'business-metrics-dashboard',
    name: 'BusinessMetricsDashboard',
    component: () => import('@/views/business/BusinessMetricsDashboardView.vue'),
    meta: {
      title: '业务指标仪表盘',
      icon: 'chart-bar',
      requiresAuth: true,
    },
  },
];

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
    path: '/metrics/analysis',
    name: 'MetricsAnalysis',
    component: () => import('../views/MetricsAnalysisView.vue'),
  },
  {
    path: '/predictive-analytics',
    name: 'PredictiveAnalytics',
    component: () => import('../views/PredictiveAnalyticsView.vue'),
  },
  {
    path: '/services',
    name: 'ServicesHealth',
    component: () => import('../views/ServicesHealthView.vue'),
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
    path: '/business-metrics/:id',
    name: 'BusinessMetricDetails',
    component: () => import('../components/business/BusinessMetricDetails.vue'),
  },
  {
    path: '/alerts',
    name: 'Alerts',
    component: () => import('../views/AlertsView.vue'),
  },
  {
    path: '/schedules',
    name: 'Schedules',
    component: () => import('../views/SchedulesView.vue'),
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
  {
    path: '/',
    component: AppLayout,
    redirect: '/dashboard',
    children: [
      // 添加业务指标路由
      ...businessMetricsRoutes,
    ]
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router; 