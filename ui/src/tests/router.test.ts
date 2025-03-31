import { describe, it, expect } from 'vitest';
import router from '../router';

describe('Router Configuration', () => {
  it('应该包含所有必要的路由', () => {
    const routeNames = router.getRoutes().map(route => route.name);
    
    // 检查所有必要的路由是否都存在
    const expectedRoutes = [
      'Dashboard',
      'Metrics',
      'Logs',
      'Deployments',
      'Knowledge',
      'AutoHeal',
      'DataSources',
      'BusinessMetrics',
      'Dashboards',
      'Settings'
    ];
    
    expectedRoutes.forEach(routeName => {
      expect(routeNames).toContain(routeName);
    });
  });
  
  it('应该正确配置仪表盘路由', () => {
    const dashboardsRoute = router.getRoutes().find(route => route.name === 'Dashboards');
    
    expect(dashboardsRoute).toBeDefined();
    expect(dashboardsRoute?.path).toBe('/dashboards');
    // 检查组件是否正确设置为延迟加载
    expect(dashboardsRoute?.components?.default).toBeTruthy();
  });
  
  it('所有路由都应该有有效的路径和组件', () => {
    router.getRoutes().forEach(route => {
      expect(route.path).toBeTruthy();
      expect(route.components?.default).toBeTruthy();
    });
  });
}); 