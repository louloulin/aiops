<script setup lang="ts">
import { ref } from 'vue';
import DashboardGenerator from '../components/dashboards/DashboardGenerator.vue';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Button } from '../components/ui/button';

// State
const activeTab = ref('dashboards');

// Mock dashboard data
interface Dashboard {
  id: string;
  title: string;
  created: string;
  updatedAt: string;
  panels: number;
  owner: string;
}

const dashboards = ref<Dashboard[]>([
  {
    id: 'dash-001',
    title: 'System Health Overview',
    created: '2023-10-15',
    updatedAt: '2023-11-20',
    panels: 8,
    owner: 'Admin'
  },
  {
    id: 'dash-002',
    title: 'API Performance',
    created: '2023-09-05',
    updatedAt: '2023-11-18',
    panels: 6,
    owner: 'Admin'
  },
  {
    id: 'dash-003',
    title: 'Database Metrics',
    created: '2023-08-22',
    updatedAt: '2023-11-15',
    panels: 5,
    owner: 'DBA Team'
  }
]);
</script>

<template>
  <div class="container mx-auto p-6">
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-3xl font-bold">Dashboards</h1>
        <p class="text-gray-500 mt-1">Manage and generate system dashboards</p>
      </div>
      <div class="flex space-x-2">
        <Button variant="outline">Import Dashboard</Button>
        <Button>Export All</Button>
      </div>
    </div>
    
    <Tabs v-model="activeTab" class="w-full">
      <TabsList class="grid w-full grid-cols-2">
        <TabsTrigger value="dashboards">Existing Dashboards</TabsTrigger>
        <TabsTrigger value="generator">Dashboard Generator</TabsTrigger>
      </TabsList>
      
      <TabsContent value="dashboards">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead class="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Dashboard
                  </th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Created
                  </th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Last Updated
                  </th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Panels
                  </th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Owner
                  </th>
                  <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                <tr v-for="dashboard in dashboards" :key="dashboard.id">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900 dark:text-white">{{ dashboard.title }}</div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">ID: {{ dashboard.id }}</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {{ dashboard.created }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {{ dashboard.updatedAt }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {{ dashboard.panels }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {{ dashboard.owner }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <a href="#" class="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 mr-3">View</a>
                    <a href="#" class="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 mr-3">Edit</a>
                    <a href="#" class="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300">Delete</a>
                  </td>
                </tr>
                <!-- Empty state if no dashboards -->
                <tr v-if="dashboards.length === 0">
                  <td colspan="6" class="px-6 py-4 text-center text-sm font-medium text-gray-500 dark:text-gray-400">
                    No dashboards found. Use the Dashboard Generator to create one.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div class="mt-6 border-t pt-4 flex justify-between items-center">
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Showing {{ dashboards.length }} dashboard(s)
            </p>
            <div class="flex space-x-2">
              <Button variant="outline" size="sm">Refresh</Button>
              <Button size="sm">Create Dashboard</Button>
            </div>
          </div>
        </div>
      </TabsContent>
      
      <TabsContent value="generator">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <DashboardGenerator />
        </div>
      </TabsContent>
    </Tabs>
  </div>
</template> 