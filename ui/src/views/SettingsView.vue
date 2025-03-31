<template>
  <div class="container mx-auto px-4 py-8">
    <h1 class="text-2xl font-bold mb-6 text-gray-900 dark:text-white">设置</h1>
    <div class="bg-white dark:bg-[#232323] rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-800">
      <div class="space-y-8">
        <!-- 系统设置 -->
        <section>
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">系统设置</h2>
          <div class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="space-y-2">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">环境</label>
                <select class="w-full bg-white dark:bg-[#2e2e2e] border border-gray-300 dark:border-gray-700 rounded-md py-2 px-3 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-[#3ecf8e]">
                  <option>生产环境</option>
                  <option>测试环境</option>
                  <option>开发环境</option>
                </select>
              </div>
              <div class="space-y-2">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">日志级别</label>
                <select class="w-full bg-white dark:bg-[#2e2e2e] border border-gray-300 dark:border-gray-700 rounded-md py-2 px-3 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-[#3ecf8e]">
                  <option>错误</option>
                  <option>警告</option>
                  <option>信息</option>
                  <option>调试</option>
                </select>
              </div>
            </div>
            
            <div class="space-y-2">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">数据保留期（天数）</label>
              <input type="number" class="w-full bg-white dark:bg-[#2e2e2e] border border-gray-300 dark:border-gray-700 rounded-md py-2 px-3 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-[#3ecf8e]" value="30">
            </div>
            
            <div class="flex items-center">
              <input type="checkbox" id="enableMetrics" class="h-4 w-4 text-blue-600 dark:text-[#3ecf8e] focus:ring-blue-500 dark:focus:ring-[#3ecf8e] border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700">
              <label for="enableMetrics" class="ml-2 block text-sm text-gray-700 dark:text-gray-300">启用详细指标收集</label>
            </div>
          </div>
        </section>
        
        <!-- 通知设置 -->
        <section>
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">通知设置</h2>
          <div class="space-y-4">
            <div class="space-y-2">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">警报邮箱</label>
              <input type="email" class="w-full bg-white dark:bg-[#2e2e2e] border border-gray-300 dark:border-gray-700 rounded-md py-2 px-3 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-[#3ecf8e]" placeholder="admin@example.com">
            </div>
            
            <div class="flex items-center">
              <input type="checkbox" id="enableSlack" class="h-4 w-4 text-blue-600 dark:text-[#3ecf8e] focus:ring-blue-500 dark:focus:ring-[#3ecf8e] border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700" checked>
              <label for="enableSlack" class="ml-2 block text-sm text-gray-700 dark:text-gray-300">启用 Slack 通知</label>
            </div>
            
            <div class="flex items-center">
              <input type="checkbox" id="enablePagerDuty" class="h-4 w-4 text-blue-600 dark:text-[#3ecf8e] focus:ring-blue-500 dark:focus:ring-[#3ecf8e] border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700">
              <label for="enablePagerDuty" class="ml-2 block text-sm text-gray-700 dark:text-gray-300">启用 PagerDuty 集成</label>
            </div>
          </div>
        </section>
        
        <!-- API设置 -->
        <section>
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">API 设置</h2>
          <div class="space-y-4">
            <div class="space-y-2">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">API 密钥</label>
              <div class="flex">
                <input type="password" value="••••••••••••••••" readonly class="flex-1 bg-white dark:bg-[#2e2e2e] border border-gray-300 dark:border-gray-700 rounded-l-md py-2 px-3 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-[#3ecf8e]">
                <button class="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 border-l-0 rounded-r-md px-4 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-[#3ecf8e]">
                  复制
                </button>
              </div>
            </div>
            
            <div class="space-y-2">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">速率限制 (请求/分钟)</label>
              <input type="number" class="w-full bg-white dark:bg-[#2e2e2e] border border-gray-300 dark:border-gray-700 rounded-md py-2 px-3 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-[#3ecf8e]" value="100">
            </div>
            
            <div class="flex items-center">
              <input type="checkbox" id="enableAuthRequired" class="h-4 w-4 text-blue-600 dark:text-[#3ecf8e] focus:ring-blue-500 dark:focus:ring-[#3ecf8e] border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700" checked>
              <label for="enableAuthRequired" class="ml-2 block text-sm text-gray-700 dark:text-gray-300">所有 API 请求需要身份验证</label>
            </div>
          </div>
        </section>
        
        <!-- 操作按钮 -->
        <div class="flex justify-end space-x-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button class="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500">
            取消
          </button>
          <button class="px-4 py-2 bg-blue-600 dark:bg-[#3ecf8e] text-white dark:text-gray-900 rounded-md hover:bg-blue-700 dark:hover:bg-[#2eb676] focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-[#3ecf8e]">
            保存更改
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Settings view component
</script> 