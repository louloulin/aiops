import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import Sidebar from '../components/SideBar.vue';

describe('Sidebar', () => {
  let wrapper: any;

  beforeEach(() => {
    // 创建组件实例
    wrapper = mount(Sidebar);
  });

  it('应该正确加载组件', () => {
    expect(wrapper.exists()).toBe(true);
  });

  it('应该包含仪表盘菜单项', () => {
    // 在模板中找到所有菜单项并检查是否包含仪表盘菜单
    const menuItems = wrapper.vm.menuItems;
    const dashboardItem = menuItems.find((item: any) => item.id === 'dashboards');
    
    expect(dashboardItem).toBeDefined();
    expect(dashboardItem.label).toBe('Dashboards');
    expect(dashboardItem.path).toBe('/dashboards');
  });

  it('应该有正确顺序的菜单项', () => {
    const menuItems = wrapper.vm.menuItems;
    const menuIds = menuItems.map((item: any) => item.id);
    
    // 检查仪表盘在业务指标之后，设置之前
    const dashboardIndex = menuIds.indexOf('dashboards');
    const businessMetricsIndex = menuIds.indexOf('business-metrics');
    const settingsIndex = menuIds.indexOf('settings');
    
    expect(dashboardIndex).toBeGreaterThan(businessMetricsIndex);
    expect(dashboardIndex).toBeLessThan(settingsIndex);
  });
}); 