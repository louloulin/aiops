<script setup lang="ts">
import { ref, computed } from 'vue';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Separator } from '../ui/separator';
// 暂时注释掉 toast 导入，因为没有安装
// import { toast } from 'vue-sonner';

// 使用 console.log 替代 toast
const toast = {
  success: (msg: string) => console.log('Success:', msg),
  error: (msg: string) => console.error('Error:', msg)
};

// API base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Dashboard types
interface MetricSource {
  id: string;
  name: string;
  type: string;
}

interface PanelConfig {
  id: string;
  title: string;
  metricSource: string;
  query: string;
  type: 'timeseries' | 'gauge' | 'stat' | 'table' | 'heatmap';
  description?: string;
}

interface DashboardConfig {
  id?: string;
  title: string;
  description: string;
  panels: PanelConfig[];
  autoRefresh: boolean;
  refreshInterval: string;
  timeRange: string;
  tags: string[];
}

// State
const metricSources = ref<MetricSource[]>([]);
const availableMetrics = ref<string[]>([]);
const dashboardConfig = ref<DashboardConfig>({
  title: '',
  description: '',
  panels: [],
  autoRefresh: true,
  refreshInterval: '5m',
  timeRange: '24h',
  tags: [],
});
const newPanelTitle = ref('');
const newPanelMetricSource = ref('');
const newPanelQuery = ref('');
const newPanelType = ref<'timeseries'>('timeseries');
const newPanelDescription = ref('');
const newTag = ref('');
const isLoading = ref(false);
const previewUrl = ref('');
const activeTab = ref('config');
const generatedDashboards = ref<DashboardConfig[]>([]);

// Computed properties
const isValidPanel = computed(() => {
  return newPanelTitle.value && newPanelMetricSource.value && newPanelQuery.value;
});

const isValidDashboard = computed(() => {
  return dashboardConfig.value.title && dashboardConfig.value.panels.length > 0;
});

// Methods
const fetchMetricSources = async () => {
  try {
    // In a real app, this would fetch from an API
    // For now, we'll use mock data
    metricSources.value = generateMockMetricSources();
  } catch (error) {
    console.error('Error fetching metric sources:', error);
    toast.error('Failed to fetch metric sources');
  }
};

const fetchAvailableMetrics = async (sourceId: string) => {
  try {
    // In a real app, this would fetch from an API
    // For now, we'll use mock data
    availableMetrics.value = generateMockMetrics(sourceId);
  } catch (error) {
    console.error('Error fetching available metrics:', error);
    toast.error('Failed to fetch available metrics');
  }
};

const addPanel = () => {
  if (!isValidPanel.value) return;

  dashboardConfig.value.panels.push({
    id: `panel-${Date.now()}`,
    title: newPanelTitle.value,
    metricSource: newPanelMetricSource.value,
    query: newPanelQuery.value,
    type: newPanelType.value,
    description: newPanelDescription.value
  });

  // Reset form
  newPanelTitle.value = '';
  newPanelQuery.value = '';
  newPanelDescription.value = '';
  
  toast.success('Panel added to dashboard');
};

const removePanel = (panelId: string) => {
  dashboardConfig.value.panels = dashboardConfig.value.panels.filter(p => p.id !== panelId);
  toast.success('Panel removed from dashboard');
};

const addTag = () => {
  if (!newTag.value) return;
  if (!dashboardConfig.value.tags.includes(newTag.value)) {
    dashboardConfig.value.tags.push(newTag.value);
    newTag.value = '';
  }
};

const removeTag = (tag: string) => {
  dashboardConfig.value.tags = dashboardConfig.value.tags.filter(t => t !== tag);
};

const generateDashboard = async () => {
  if (!isValidDashboard.value) {
    toast.error('Please provide a dashboard title and add at least one panel');
    return;
  }

  isLoading.value = true;
  try {
    // In a real application, this would call your API
    // const response = await fetch(`${API_BASE_URL}/api/dashboards`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(dashboardConfig.value)
    // });
    // const data = await response.json();
    
    // Mock response for development purposes
    await new Promise(resolve => setTimeout(resolve, 1500));
    const mockDashboardId = `dashboard-${Date.now()}`;
    previewUrl.value = `https://grafana.example.com/d/${mockDashboardId}`;
    
    // Add to generated dashboards with the mock ID
    const newDashboard = {
      ...dashboardConfig.value,
      id: mockDashboardId
    };
    generatedDashboards.value.push(newDashboard);
    
    // Reset form
    dashboardConfig.value = {
      title: '',
      description: '',
      panels: [],
      autoRefresh: true,
      refreshInterval: '5m',
      timeRange: '24h',
      tags: [],
    };
    
    toast.success('Dashboard generated successfully');
    activeTab.value = 'preview';
  } catch (error) {
    console.error('Error generating dashboard:', error);
    toast.error('Failed to generate dashboard');
  } finally {
    isLoading.value = false;
  }
};

const fetchGeneratedDashboards = async () => {
  try {
    // In a real app, this would fetch from an API
    // For now, we'll use the mock data we've generated
    // This would be replaced with an API call in a real implementation
  } catch (error) {
    console.error('Error fetching generated dashboards:', error);
    toast.error('Failed to fetch generated dashboards');
  }
};

// Mock data generators for development
const generateMockMetricSources = (): MetricSource[] => {
  return [
    { id: 'prometheus', name: 'Prometheus', type: 'timeseries' },
    { id: 'cloudwatch', name: 'AWS CloudWatch', type: 'timeseries' },
    { id: 'datadog', name: 'Datadog', type: 'timeseries' },
    { id: 'custom', name: 'Custom API', type: 'timeseries' }
  ];
};

const generateMockMetrics = (sourceId: string): string[] => {
  const metrics: Record<string, string[]> = {
    prometheus: [
      'cpu_usage_total',
      'memory_usage_bytes',
      'disk_io_time_seconds_total',
      'network_receive_bytes_total',
      'http_requests_total'
    ],
    cloudwatch: [
      'CPUUtilization',
      'MemoryUtilization',
      'NetworkIn',
      'NetworkOut',
      'DiskReadOps'
    ],
    datadog: [
      'system.cpu.user',
      'system.mem.used',
      'system.disk.in_use',
      'system.net.bytes_rcvd',
      'http.request.count'
    ],
    custom: [
      'api_response_time',
      'active_users',
      'transaction_count',
      'error_rate',
      'service_uptime'
    ]
  };
  
  return metrics[sourceId] || [];
};

// Initialize component
fetchMetricSources();
fetchGeneratedDashboards();
</script>

<template>
  <div class="space-y-6">
    <Tabs v-model="activeTab">
      <TabsList class="grid w-full grid-cols-2">
        <TabsTrigger value="config">Configure Dashboard</TabsTrigger>
        <TabsTrigger value="preview">Preview & History</TabsTrigger>
      </TabsList>
      
      <TabsContent value="config" class="space-y-6">
        <!-- Dashboard Basic Configuration -->
        <Card>
          <CardHeader>
            <CardTitle>Dashboard Configuration</CardTitle>
            <CardDescription>
              Set the basic properties for your Grafana dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div class="grid gap-4">
              <div class="grid gap-2">
                <Label for="title">Dashboard Title</Label>
                <Input id="title" v-model="dashboardConfig.title" placeholder="My Monitoring Dashboard" />
              </div>
              
              <div class="grid gap-2">
                <Label for="description">Description</Label>
                <Textarea id="description" v-model="dashboardConfig.description" placeholder="Dashboard purpose and contents..." />
              </div>
              
              <div class="grid grid-cols-2 gap-4">
                <div class="grid gap-2">
                  <Label for="timeRange">Default Time Range</Label>
                  <Select v-model="dashboardConfig.timeRange">
                    <SelectTrigger>
                      <SelectValue placeholder="Select time range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15m">Last 15 minutes</SelectItem>
                      <SelectItem value="1h">Last 1 hour</SelectItem>
                      <SelectItem value="6h">Last 6 hours</SelectItem>
                      <SelectItem value="12h">Last 12 hours</SelectItem>
                      <SelectItem value="24h">Last 24 hours</SelectItem>
                      <SelectItem value="7d">Last 7 days</SelectItem>
                      <SelectItem value="30d">Last 30 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div class="grid gap-2">
                  <Label for="refreshInterval">Refresh Interval</Label>
                  <Select v-model="dashboardConfig.refreshInterval">
                    <SelectTrigger>
                      <SelectValue placeholder="Select refresh interval" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="off">Off</SelectItem>
                      <SelectItem value="5s">5 seconds</SelectItem>
                      <SelectItem value="10s">10 seconds</SelectItem>
                      <SelectItem value="30s">30 seconds</SelectItem>
                      <SelectItem value="1m">1 minute</SelectItem>
                      <SelectItem value="5m">5 minutes</SelectItem>
                      <SelectItem value="15m">15 minutes</SelectItem>
                      <SelectItem value="30m">30 minutes</SelectItem>
                      <SelectItem value="1h">1 hour</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div class="flex items-center space-x-2">
                <Checkbox id="autoRefresh" v-model="dashboardConfig.autoRefresh" />
                <Label for="autoRefresh">Enable auto refresh</Label>
              </div>
              
              <div class="grid gap-2">
                <Label>Tags</Label>
                <div class="flex flex-wrap gap-2">
                  <div v-for="tag in dashboardConfig.tags" :key="tag" 
                       class="flex items-center bg-gray-200 dark:bg-gray-800 rounded-full px-3 py-1">
                    <span>{{ tag }}</span>
                    <button @click="removeTag(tag)" class="ml-2 text-gray-500 hover:text-gray-800 dark:hover:text-gray-300">
                      ×
                    </button>
                  </div>
                  <div class="flex items-center">
                    <Input v-model="newTag" placeholder="Add tag..." class="h-8 w-32" @keyup.enter="addTag" />
                    <Button variant="ghost" size="sm" @click="addTag" class="ml-1">+</Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <!-- Dashboard Panels Configuration -->
        <Card>
          <CardHeader>
            <CardTitle>Dashboard Panels</CardTitle>
            <CardDescription>
              Add visualization panels to your dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div class="space-y-4">
              <!-- Current Panels -->
              <div v-if="dashboardConfig.panels.length > 0" class="space-y-4">
                <h4 class="text-sm font-medium">Current Panels</h4>
                <div class="grid gap-4">
                  <div v-for="panel in dashboardConfig.panels" :key="panel.id" 
                       class="flex justify-between items-center border p-4 rounded-md">
                    <div>
                      <h5 class="font-medium">{{ panel.title }}</h5>
                      <p class="text-sm text-gray-500">
                        {{ panel.type }} - {{ panel.metricSource }}
                      </p>
                    </div>
                    <Button variant="destructive" size="sm" @click="removePanel(panel.id)">
                      Remove
                    </Button>
                  </div>
                </div>
                <Separator />
              </div>
              
              <!-- Add New Panel -->
              <div class="space-y-4">
                <h4 class="text-sm font-medium">Add New Panel</h4>
                <div class="grid gap-4">
                  <div class="grid gap-2">
                    <Label for="panelTitle">Panel Title</Label>
                    <Input id="panelTitle" v-model="newPanelTitle" placeholder="CPU Usage" />
                  </div>
                  
                  <div class="grid gap-2">
                    <Label for="metricSource">Metric Source</Label>
                    <Select v-model="newPanelMetricSource" @update:modelValue="fetchAvailableMetrics(newPanelMetricSource)">
                      <SelectTrigger>
                        <SelectValue placeholder="Select metric source" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem v-for="source in metricSources" :key="source.id" :value="source.id">
                          {{ source.name }}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div class="grid gap-2">
                    <Label for="panelType">Panel Type</Label>
                    <Select v-model="newPanelType">
                      <SelectTrigger>
                        <SelectValue placeholder="Select panel type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="timeseries">Time Series</SelectItem>
                        <SelectItem value="gauge">Gauge</SelectItem>
                        <SelectItem value="stat">Stat</SelectItem>
                        <SelectItem value="table">Table</SelectItem>
                        <SelectItem value="heatmap">Heatmap</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div class="grid gap-2">
                    <Label for="metricQuery">Metric Query</Label>
                    <div v-if="availableMetrics.length > 0" class="grid gap-2">
                      <Select v-model="newPanelQuery">
                        <SelectTrigger>
                          <SelectValue placeholder="Select metric" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem v-for="metric in availableMetrics" :key="metric" :value="metric">
                            {{ metric }}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Input v-else id="metricQuery" v-model="newPanelQuery" placeholder="rate(cpu_usage_total[5m])" />
                  </div>
                  
                  <div class="grid gap-2">
                    <Label for="panelDescription">Description (Optional)</Label>
                    <Textarea id="panelDescription" v-model="newPanelDescription" placeholder="Panel description..." />
                  </div>
                  
                  <Button @click="addPanel" :disabled="!isValidPanel">Add Panel</Button>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button @click="generateDashboard" :disabled="!isValidDashboard || isLoading" class="w-full">
              <span v-if="isLoading">Generating...</span>
              <span v-else>Generate Dashboard</span>
            </Button>
          </CardFooter>
        </Card>
      </TabsContent>
      
      <TabsContent value="preview" class="space-y-6">
        <!-- Dashboard Preview -->
        <Card v-if="previewUrl">
          <CardHeader>
            <CardTitle>Dashboard Preview</CardTitle>
            <CardDescription>
              Preview of your generated Grafana dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div class="border rounded-md p-4 bg-gray-50 dark:bg-gray-900">
              <div class="text-center">
                <p class="text-sm text-gray-500 mb-2">Dashboard URL:</p>
                <a :href="previewUrl" target="_blank" class="text-blue-500 hover:underline">{{ previewUrl }}</a>
              </div>
              <!-- In a real app, you could embed an iframe preview here -->
              <div class="mt-4 p-4 border rounded-md bg-white dark:bg-gray-800">
                <p class="text-center text-gray-400">Preview not available in development mode</p>
                <p class="text-center text-gray-400 text-sm">Click the URL above to view in Grafana</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <!-- Generated Dashboards History -->
        <Card>
          <CardHeader>
            <CardTitle>Generated Dashboards</CardTitle>
            <CardDescription>
              History of dashboards you've generated
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div v-if="generatedDashboards.length === 0" class="text-center p-4 text-gray-500">
              No dashboards generated yet
            </div>
            <div v-else class="space-y-4">
              <div v-for="dashboard in generatedDashboards" :key="dashboard.id" 
                   class="border p-4 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800">
                <div class="flex justify-between items-start">
                  <div>
                    <h4 class="font-medium">{{ dashboard.title }}</h4>
                    <p class="text-sm text-gray-500">{{ dashboard.panels.length }} panels</p>
                    <div class="flex flex-wrap gap-1 mt-1">
                      <span v-for="tag in dashboard.tags" :key="tag" 
                           class="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">{{ tag }}</span>
                    </div>
                  </div>
                  <div>
                    <a :href="`https://grafana.example.com/d/${dashboard.id}`" target="_blank"
                       class="text-blue-500 hover:underline text-sm">View Dashboard</a>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  </div>
</template> 