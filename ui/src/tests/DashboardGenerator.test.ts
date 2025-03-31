import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import DashboardGenerator from '../components/dashboards/DashboardGenerator.vue';

// 模拟 UI 组件
vi.mock('../components/ui/button', () => ({
  Button: {
    name: 'Button',
    template: '<button><slot /></button>'
  }
}));

vi.mock('../components/ui/input', () => ({
  Input: {
    name: 'Input',
    template: '<input v-bind="$attrs" />'
  }
}));

vi.mock('../components/ui/label', () => ({
  Label: {
    name: 'Label',
    template: '<label><slot /></label>'
  }
}));

vi.mock('../components/ui/checkbox', () => ({
  Checkbox: {
    name: 'Checkbox',
    template: '<input type="checkbox" v-bind="$attrs" />'
  }
}));

vi.mock('../components/ui/select', () => ({
  Select: {
    name: 'Select',
    template: '<select v-bind="$attrs"><slot /></select>'
  },
  SelectContent: {
    name: 'SelectContent',
    template: '<div><slot /></div>'
  },
  SelectItem: {
    name: 'SelectItem',
    template: '<option :value="$attrs.value"><slot /></option>'
  },
  SelectTrigger: {
    name: 'SelectTrigger',
    template: '<div><slot /></div>'
  },
  SelectValue: {
    name: 'SelectValue',
    template: '<span><slot /></span>'
  }
}));

vi.mock('../components/ui/textarea', () => ({
  Textarea: {
    name: 'Textarea',
    template: '<textarea v-bind="$attrs"></textarea>'
  }
}));

vi.mock('../components/ui/card', () => ({
  Card: {
    name: 'Card',
    template: '<div><slot /></div>'
  },
  CardContent: {
    name: 'CardContent',
    template: '<div><slot /></div>'
  },
  CardDescription: {
    name: 'CardDescription',
    template: '<p><slot /></p>'
  },
  CardFooter: {
    name: 'CardFooter',
    template: '<footer><slot /></footer>'
  },
  CardHeader: {
    name: 'CardHeader',
    template: '<header><slot /></header>'
  },
  CardTitle: {
    name: 'CardTitle',
    template: '<h3><slot /></h3>'
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

vi.mock('../components/ui/separator', () => ({
  Separator: {
    name: 'Separator',
    template: '<hr />'
  }
}));

describe('DashboardGenerator', () => {
  let wrapper;

  beforeEach(() => {
    // 创建组件实例
    wrapper = mount(DashboardGenerator, {
      global: {
        stubs: {
          Button: true,
          Input: true,
          Label: true,
          Checkbox: true,
          Select: true,
          SelectContent: true,
          SelectItem: true,
          SelectTrigger: true,
          SelectValue: true,
          Textarea: true,
          Card: true,
          CardContent: true,
          CardDescription: true,
          CardFooter: true,
          CardHeader: true,
          CardTitle: true,
          Tabs: true,
          TabsContent: true,
          TabsList: true,
          TabsTrigger: true,
          Separator: true
        }
      }
    });
  });

  it('应该正确加载组件', () => {
    expect(wrapper.exists()).toBe(true);
  });

  it('应该初始化正确的默认状态', () => {
    // 测试仪表盘配置的初始状态
    const vm = wrapper.vm;
    expect(vm.dashboardConfig.title).toBe('');
    expect(vm.dashboardConfig.description).toBe('');
    expect(vm.dashboardConfig.panels).toEqual([]);
    expect(vm.dashboardConfig.autoRefresh).toBe(true);
    expect(vm.dashboardConfig.refreshInterval).toBe('5m');
    expect(vm.dashboardConfig.timeRange).toBe('24h');
    expect(vm.dashboardConfig.tags).toEqual([]);

    // 测试其他状态变量
    expect(vm.newPanelTitle).toBe('');
    expect(vm.newPanelMetricSource).toBe('');
    expect(vm.newPanelQuery).toBe('');
    expect(vm.newPanelType).toBe('timeseries');
    expect(vm.isLoading).toBe(false);
    expect(vm.activeTab).toBe('config');
    expect(vm.generatedDashboards).toEqual([]);
  });

  it('应该通过计算属性正确验证面板输入', async () => {
    const vm = wrapper.vm;
    
    // 初始状态，面板输入无效
    expect(vm.isValidPanel).toBe(false);
    
    // 更新必要的输入字段
    await wrapper.setData({
      newPanelTitle: 'Test Panel',
      newPanelMetricSource: 'prometheus',
      newPanelQuery: 'cpu_usage_total',
    });
    
    // 验证面板输入现在有效
    expect(vm.isValidPanel).toBe(true);
  });

  it('应该通过计算属性正确验证仪表盘配置', async () => {
    const vm = wrapper.vm;
    
    // 初始状态，仪表盘配置无效
    expect(vm.isValidDashboard).toBe(false);
    
    // 添加标题，但没有面板，应该仍无效
    await wrapper.setData({
      dashboardConfig: {
        ...vm.dashboardConfig,
        title: 'Test Dashboard'
      }
    });
    expect(vm.isValidDashboard).toBe(false);
    
    // 添加面板，应该变为有效
    await wrapper.setData({
      dashboardConfig: {
        ...vm.dashboardConfig,
        title: 'Test Dashboard',
        panels: [
          {
            id: 'panel-1',
            title: 'CPU Usage',
            metricSource: 'prometheus',
            query: 'cpu_usage_total',
            type: 'timeseries'
          }
        ]
      }
    });
    expect(vm.isValidDashboard).toBe(true);
  });

  it('应该能添加面板到仪表盘配置', async () => {
    const vm = wrapper.vm;
    
    // 设置面板数据
    await wrapper.setData({
      newPanelTitle: 'CPU Usage',
      newPanelMetricSource: 'prometheus',
      newPanelQuery: 'cpu_usage_total',
      newPanelType: 'timeseries',
      newPanelDescription: 'Shows CPU usage over time'
    });
    
    // 调用添加面板方法
    vm.addPanel();
    
    // 验证面板已添加
    expect(vm.dashboardConfig.panels.length).toBe(1);
    expect(vm.dashboardConfig.panels[0].title).toBe('CPU Usage');
    expect(vm.dashboardConfig.panels[0].metricSource).toBe('prometheus');
    expect(vm.dashboardConfig.panels[0].query).toBe('cpu_usage_total');
    expect(vm.dashboardConfig.panels[0].type).toBe('timeseries');
    expect(vm.dashboardConfig.panels[0].description).toBe('Shows CPU usage over time');
    
    // 验证表单已重置
    expect(vm.newPanelTitle).toBe('');
    expect(vm.newPanelQuery).toBe('');
    expect(vm.newPanelDescription).toBe('');
  });

  it('应该能从仪表盘配置移除面板', async () => {
    const vm = wrapper.vm;
    
    // 添加测试面板
    await wrapper.setData({
      dashboardConfig: {
        ...vm.dashboardConfig,
        panels: [
          {
            id: 'panel-1',
            title: 'CPU Usage',
            metricSource: 'prometheus',
            query: 'cpu_usage_total',
            type: 'timeseries'
          },
          {
            id: 'panel-2',
            title: 'Memory Usage',
            metricSource: 'prometheus',
            query: 'memory_usage_bytes',
            type: 'gauge'
          }
        ]
      }
    });
    
    // 验证有两个面板
    expect(vm.dashboardConfig.panels.length).toBe(2);
    
    // 调用移除面板方法
    vm.removePanel('panel-1');
    
    // 验证第一个面板已移除
    expect(vm.dashboardConfig.panels.length).toBe(1);
    expect(vm.dashboardConfig.panels[0].id).toBe('panel-2');
  });

  it('应该能添加和移除标签', async () => {
    const vm = wrapper.vm;
    
    // 添加标签
    await wrapper.setData({ newTag: 'production' });
    vm.addTag();
    
    // 验证标签已添加
    expect(vm.dashboardConfig.tags).toContain('production');
    expect(vm.newTag).toBe('');
    
    // 添加另一个标签
    await wrapper.setData({ newTag: 'monitoring' });
    vm.addTag();
    expect(vm.dashboardConfig.tags).toContain('monitoring');
    
    // 移除标签
    vm.removeTag('production');
    expect(vm.dashboardConfig.tags).not.toContain('production');
    expect(vm.dashboardConfig.tags).toContain('monitoring');
  });

  it('应该能生成仪表盘并更新历史记录', async () => {
    const vm = wrapper.vm;
    
    // 模拟定时器
    const originalDateNow = Date.now;
    Date.now = vi.fn(() => 1234567890);
    
    // 设置有效的仪表盘配置
    await wrapper.setData({
      dashboardConfig: {
        title: 'Test Dashboard',
        description: 'Test Description',
        panels: [
          {
            id: 'panel-1',
            title: 'CPU Usage',
            metricSource: 'prometheus',
            query: 'cpu_usage_total',
            type: 'timeseries'
          }
        ],
        autoRefresh: true,
        refreshInterval: '5m',
        timeRange: '24h',
        tags: ['production', 'testing']
      }
    });
    
    // 模拟setTimeout
    vi.useFakeTimers();
    
    // 生成仪表盘
    const generatePromise = vm.generateDashboard();
    
    // 推进定时器
    vi.advanceTimersByTime(1500);
    
    // 等待生成完成
    await generatePromise;
    
    // 验证结果
    expect(vm.previewUrl).toBe('https://grafana.example.com/d/dashboard-1234567890');
    expect(vm.generatedDashboards.length).toBe(1);
    expect(vm.generatedDashboards[0].title).toBe('Test Dashboard');
    expect(vm.generatedDashboards[0].id).toBe('dashboard-1234567890');
    expect(vm.activeTab).toBe('preview');
    
    // 验证表单已重置
    expect(vm.dashboardConfig.title).toBe('');
    expect(vm.dashboardConfig.panels).toEqual([]);
    
    // 恢复模拟
    Date.now = originalDateNow;
    vi.useRealTimers();
  });
}); 