import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import DashboardsView from '../views/DashboardsView.vue';

// 模拟 DashboardGenerator 组件
vi.mock('../components/dashboards/DashboardGenerator.vue', () => ({
  default: {
    name: 'DashboardGenerator',
    template: '<div class="dashboard-generator-mock">Dashboard Generator Mock</div>'
  }
}));

// 模拟 UI 组件
vi.mock('../components/ui/button', () => ({
  Button: {
    name: 'Button',
    template: '<button><slot /></button>'
  }
}));

vi.mock('../components/ui/tabs', () => ({
  Tabs: {
    name: 'Tabs',
    template: '<div><slot /></div>'
  },
  TabsContent: {
    name: 'TabsContent',
    template: '<div v-if="$attrs.value === $parent.modelValue"><slot /></div>'
  },
  TabsList: {
    name: 'TabsList',
    template: '<div><slot /></div>'
  },
  TabsTrigger: {
    name: 'TabsTrigger',
    template: '<button @click="$parent.$emit(\'update:modelValue\', $attrs.value)"><slot /></button>'
  }
}));

describe('DashboardsView', () => {
  let wrapper: any;

  beforeEach(() => {
    // 创建组件实例
    wrapper = mount(DashboardsView, {
      global: {
        stubs: {
          Button: true,
          Tabs: true,
          TabsContent: true,
          TabsList: true,
          TabsTrigger: true,
          DashboardGenerator: true
        }
      }
    });
  });

  it('应该正确加载组件', () => {
    expect(wrapper.exists()).toBe(true);
  });

  it('应该有正确的初始标签状态', () => {
    const vm: any = wrapper.vm;
    expect(vm.activeTab).toBe('dashboards');
  });

  it('应该包含模拟的仪表盘数据', () => {
    const vm: any = wrapper.vm;
    
    // 验证仪表盘数据加载
    expect(vm.dashboards.length).toBe(3);
    
    // 验证第一个仪表盘的数据
    expect(vm.dashboards[0].id).toBe('dash-001');
    expect(vm.dashboards[0].title).toBe('System Health Overview');
    
    // 验证第二个仪表盘的数据
    expect(vm.dashboards[1].id).toBe('dash-002');
    expect(vm.dashboards[1].title).toBe('API Performance');
    
    // 验证第三个仪表盘的数据
    expect(vm.dashboards[2].id).toBe('dash-003');
    expect(vm.dashboards[2].title).toBe('Database Metrics');
  });

  it('应该能切换活动标签', async () => {
    const vm: any = wrapper.vm;
    
    // 初始标签是 'dashboards'
    expect(vm.activeTab).toBe('dashboards');
    
    // 模拟切换到 'generator' 标签
    await wrapper.setData({ activeTab: 'generator' });
    
    // 验证标签已切换
    expect(vm.activeTab).toBe('generator');
  });

  it('应该在生成器标签页中渲染 DashboardGenerator 组件', async () => {
    // 切换到生成器标签
    await wrapper.setData({ activeTab: 'generator' });
    
    // 等待下一个渲染周期
    await wrapper.vm.$nextTick();
    
    // 在测试环境中，使用类名查找组件
    const generator = wrapper.find('.dashboard-generator-mock');
    expect(generator.exists()).toBe(true);
  });

  it('应该在仪表盘标签页中显示仪表盘列表', async () => {
    // 切换到仪表盘标签
    await wrapper.setData({ activeTab: 'dashboards' });
    
    // 等待下一个渲染周期
    await wrapper.vm.$nextTick();
    
    // 找到表格中的行（除了表头行）
    const dashboardRows = wrapper.findAll('tr').slice(1);
    
    // 验证列表中显示了正确数量的仪表盘
    expect(dashboardRows.length).toBe(3);
  });
}); 