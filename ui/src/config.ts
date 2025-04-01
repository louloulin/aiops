// API基础URL配置
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:9700/api';

// 应用程序配置
export const APP_CONFIG = {
  // 表格每页显示的记录数
  pageSize: 10,
  
  // 应用标题
  appTitle: 'AIOps平台',
  
  // 系统监控刷新间隔（毫秒）
  metricsRefreshInterval: 60000, // 1分钟
  
  // 图表颜色主题
  chartColors: {
    primary: 'rgba(54, 162, 235, 1)',
    secondary: 'rgba(255, 99, 132, 1)',
    success: 'rgba(75, 192, 192, 1)',
    warning: 'rgba(255, 206, 86, 1)',
    danger: 'rgba(255, 99, 132, 1)',
    info: 'rgba(153, 102, 255, 1)',
    light: 'rgba(201, 203, 207, 1)',
    dark: 'rgba(33, 37, 41, 1)',
  },
  
  // 指标阈值配置
  thresholds: {
    cpu: {
      warning: 60,
      danger: 80
    },
    memory: {
      warning: 70,
      danger: 85
    },
    disk: {
      warning: 75, 
      danger: 90
    }
  }
}; 