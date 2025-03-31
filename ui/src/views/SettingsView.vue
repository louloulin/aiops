<template>
  <div class="container mx-auto px-4 py-8">
    <h1 class="text-2xl font-bold mb-6 text-white">Settings</h1>
    <div class="bg-[#232323] rounded-lg p-6">
      <div class="space-y-8">
        <!-- System Settings -->
        <section>
          <h2 class="text-xl font-semibold text-white mb-4">System Settings</h2>
          <div class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="space-y-2">
                <label class="block text-sm font-medium text-gray-300">Environment</label>
                <select class="w-full bg-[#2e2e2e] border border-gray-700 rounded-md py-2 px-3 text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#3ecf8e]">
                  <option>Production</option>
                  <option>Staging</option>
                  <option>Development</option>
                </select>
              </div>
              <div class="space-y-2">
                <label class="block text-sm font-medium text-gray-300">Log Level</label>
                <select class="w-full bg-[#2e2e2e] border border-gray-700 rounded-md py-2 px-3 text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#3ecf8e]">
                  <option>Error</option>
                  <option>Warning</option>
                  <option>Info</option>
                  <option>Debug</option>
                </select>
              </div>
            </div>
            
            <div class="space-y-2">
              <label class="block text-sm font-medium text-gray-300">Data Retention Period (days)</label>
              <input type="number" class="w-full bg-[#2e2e2e] border border-gray-700 rounded-md py-2 px-3 text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#3ecf8e]" value="30">
            </div>
            
            <div class="flex items-center">
              <input type="checkbox" id="enableMetrics" class="h-4 w-4 text-[#3ecf8e] focus:ring-[#3ecf8e] border-gray-600 rounded bg-gray-700">
              <label for="enableMetrics" class="ml-2 block text-sm text-gray-300">Enable Detailed Metrics Collection</label>
            </div>
          </div>
        </section>
        
        <!-- Notification Settings -->
        <section>
          <h2 class="text-xl font-semibold text-white mb-4">Notification Settings</h2>
          <div class="space-y-4">
            <div class="space-y-2">
              <label class="block text-sm font-medium text-gray-300">Alert Email</label>
              <input type="email" class="w-full bg-[#2e2e2e] border border-gray-700 rounded-md py-2 px-3 text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#3ecf8e]" placeholder="admin@example.com">
            </div>
            
            <div class="flex items-center">
              <input type="checkbox" id="enableSlack" class="h-4 w-4 text-[#3ecf8e] focus:ring-[#3ecf8e] border-gray-600 rounded bg-gray-700" checked>
              <label for="enableSlack" class="ml-2 block text-sm text-gray-300">Enable Slack Notifications</label>
            </div>
            
            <div class="flex items-center">
              <input type="checkbox" id="enablePagerDuty" class="h-4 w-4 text-[#3ecf8e] focus:ring-[#3ecf8e] border-gray-600 rounded bg-gray-700">
              <label for="enablePagerDuty" class="ml-2 block text-sm text-gray-300">Enable PagerDuty Integration</label>
            </div>
          </div>
        </section>
        
        <!-- Action Buttons -->
        <div class="flex justify-end space-x-4 pt-4 border-t border-gray-700">
          <button class="px-4 py-2 bg-gray-700 text-gray-300 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500">
            Cancel
          </button>
          <button class="px-4 py-2 bg-[#3ecf8e] text-gray-900 rounded-md hover:bg-[#2eb676] focus:outline-none focus:ring-2 focus:ring-[#3ecf8e]">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Settings view component
</script> 