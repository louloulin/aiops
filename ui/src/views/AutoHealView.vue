<template>
  <div class="container mx-auto px-4 py-8">
    <h1 class="text-2xl font-bold mb-6 text-white">Auto Healing</h1>
    <div class="bg-[#232323] rounded-lg p-6">
      <p class="text-gray-300 mb-4">Configure and monitor automatic healing processes for your infrastructure.</p>
      
      <!-- Placeholder content -->
      <div class="space-y-6 mt-6">
        <div class="bg-[#2e2e2e] p-4 rounded-lg">
          <h3 class="text-[#3ecf8e] font-medium mb-2">Active Healing Rules</h3>
          <div class="border border-gray-700 rounded-md overflow-hidden">
            <table class="min-w-full divide-y divide-gray-700">
              <thead class="bg-[#1e1e1e]">
                <tr>
                  <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Rule Name</th>
                  <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Condition</th>
                  <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Action</th>
                  <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-700">
                <tr>
                  <td class="px-4 py-3 text-sm text-gray-300">High CPU Usage</td>
                  <td class="px-4 py-3 text-sm text-gray-300">CPU > 90% for 5min</td>
                  <td class="px-4 py-3 text-sm text-gray-300">Scale up instances</td>
                  <td class="px-4 py-3 text-sm"><span class="px-2 py-1 text-xs rounded-full bg-green-900 text-green-300">Active</span></td>
                </tr>
                <tr>
                  <td class="px-4 py-3 text-sm text-gray-300">Memory Leak</td>
                  <td class="px-4 py-3 text-sm text-gray-300">Memory grows >10% per hour</td>
                  <td class="px-4 py-3 text-sm text-gray-300">Restart service</td>
                  <td class="px-4 py-3 text-sm"><span class="px-2 py-1 text-xs rounded-full bg-green-900 text-green-300">Active</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        <div class="bg-[#2e2e2e] p-4 rounded-lg">
          <h3 class="text-[#3ecf8e] font-medium mb-2">Recent Healing Actions</h3>
          <div class="space-y-3">
            <div class="flex items-center justify-between p-3 border border-gray-700 rounded-md">
              <div>
                <p class="text-sm text-white">Service api-gateway restarted</p>
                <p class="text-xs text-gray-400">Triggered by: High memory usage</p>
              </div>
              <span class="text-xs text-gray-400">10 minutes ago</span>
            </div>
            <div class="flex items-center justify-between p-3 border border-gray-700 rounded-md">
              <div>
                <p class="text-sm text-white">Database connection pool expanded</p>
                <p class="text-xs text-gray-400">Triggered by: Connection timeout</p>
              </div>
              <span class="text-xs text-gray-400">3 hours ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Auto Healing view component
</script> 