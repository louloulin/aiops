<template>
  <div class="floating-chat-container" :class="{ 'expanded': isExpanded }">
    <!-- 聊天窗口 -->
    <div v-if="isExpanded" class="chat-window" :class="{ 'maximized': isMaximized }">
      <div class="chat-header">
        <div class="header-title">
          <div class="ai-icon">
            <i class="i-carbon-bot"></i>
          </div>
          <h3>AI 助手</h3>
        </div>
        <div class="header-controls">
          <button @click="toggleSize" class="control-button" :title="isMaximized ? '缩小' : '最大化'">
            <i :class="isMaximized ? 'i-carbon-minimize' : 'i-carbon-maximize'"></i>
          </button>
          <button @click="collapse" class="control-button" title="最小化">
            <i class="i-carbon-chevron-down"></i>
          </button>
        </div>
      </div>
      <div class="chat-content">
        <ChatInterface />
      </div>
    </div>
    
    <!-- 悬浮按钮 -->
    <button v-if="!isExpanded" @click="expand" class="chat-button" :title="'打开AI助手'">
      <i class="i-carbon-bot"></i>
      <span class="pulse-ring"></span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import ChatInterface from './ChatInterface.vue';

// 控制窗口状态
const isExpanded = ref(false);
const isMaximized = ref(false);

// 展开聊天窗口
function expand() {
  isExpanded.value = true;
}

// 收起聊天窗口
function collapse() {
  isExpanded.value = false;
}

// 切换最大化和正常大小
function toggleSize() {
  isMaximized.value = !isMaximized.value;
}
</script>

<style scoped>
.floating-chat-container {
  position: fixed;
  right: 20px;
  bottom: 20px;
  z-index: 1000;
  transition: all 0.3s ease;
}

.chat-button {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background-color: var(--el-color-primary, #409EFF);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.4);
  border: 3px solid white;
  font-size: 24px;
  transition: all 0.2s;
  position: relative;
  overflow: hidden;
}

.chat-button::after {
  content: '';
  position: absolute;
  width: 15px;
  height: 15px;
  background-color: #4cd964;
  border-radius: 50%;
  bottom: 3px;
  right: 3px;
  border: 2px solid white;
}

.chat-window {
  width: 360px;
  height: 500px;
  border-radius: 12px;
  background-color: var(--el-bg-color, white);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.35);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: all 0.3s ease;
  border: 1px solid var(--el-border-color-darker, #dcdfe6);
}

.expanded.floating-chat-container .chat-window {
  animation: pop-in 0.3s ease forwards;
}

@keyframes pop-in {
  0% {
    opacity: 0;
    transform: scale(0.8) translateY(20px);
  }
  70% {
    transform: scale(1.05) translateY(-5px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.floating-chat-container.expanded {
  right: 20px;
  bottom: 20px;
}

/* 最大化状态 */
.chat-window.maximized {
  position: fixed;
  top: 20px;
  right: 20px;
  bottom: 20px;
  left: 20px;
  width: auto;
  height: auto;
  max-width: 800px;
  max-height: calc(100vh - 40px);
  margin: auto;
  border: 1px solid var(--el-border-color);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
}

.chat-header {
  padding: 14px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--el-border-color);
  background: linear-gradient(90deg, var(--el-color-primary-light-9) 0%, var(--el-bg-color) 100%);
}

.header-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ai-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background-color: var(--el-color-primary);
  color: white;
}

.chat-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--el-color-primary);
}

.header-controls {
  display: flex;
  gap: 8px;
}

.control-button {
  background: none;
  border: none;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
}

.control-button:hover {
  background-color: var(--el-fill-color-light);
  color: var(--el-text-color-primary);
}

.chat-content {
  flex: 1;
  overflow: hidden;
}

/* 添加新样式 */
.pulse-ring {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  animation: pulse 2s infinite;
  background-color: var(--el-color-primary);
  z-index: -1;
}

@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 0.8;
  }
  70% {
    transform: scale(1.3);
    opacity: 0;
  }
  100% {
    transform: scale(1.3);
    opacity: 0;
  }
}

.chat-button:hover {
  transform: scale(1.1);
  background-color: var(--el-color-primary-dark-1, #337ecc);
  box-shadow: 0 8px 22px rgba(0, 0, 0, 0.5);
}
</style> 