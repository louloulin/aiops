<template>
  <div class="floating-chat-container" :class="{ 'expanded': isExpanded, 'maximized': isMaximized }">
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
        <ChatInterface ref="chatInterface" />
      </div>
    </div>
    
    <!-- 悬浮按钮 -->
    <button 
      v-if="!isExpanded" 
      @click="expand" 
      class="chat-button" 
      :title="'打开AI助手'"
      :class="{ 'notification': hasNotification }"
    >
      <i class="i-carbon-bot"></i>
      <span class="pulse-ring"></span>
      <span v-if="hasNotification" class="notification-badge">!</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, provide, nextTick } from 'vue';
import ChatInterface from './ChatInterface.vue';

// 控制窗口状态
const isExpanded = ref(false);
const isMaximized = ref(false);
const hasNotification = ref(false);
const chatInterface = ref<InstanceType<typeof ChatInterface> | null>(null);

// 暴露公共API，允许外部组件控制聊天窗口
const publicAPI = {
  open: expand,
  close: collapse,
  toggleMaximize: toggleSize,
  sendMessage: sendMessageToChat,
  showNotification: () => { hasNotification.value = true; },
  clearNotification: () => { hasNotification.value = false; }
};

// 提供API给子组件
provide('chatAPI', publicAPI);

// 展开聊天窗口
function expand() {
  isExpanded.value = true;
  hasNotification.value = false; // 清除通知标记
}

// 收起聊天窗口
function collapse() {
  isExpanded.value = false;
}

// 切换最大化和正常大小
function toggleSize() {
  isMaximized.value = !isMaximized.value;
}

// 发送消息到聊天接口
async function sendMessageToChat(message: string) {
  if (!chatInterface.value) return;
  
  // 确保聊天窗口是展开的
  if (!isExpanded.value) {
    isExpanded.value = true;
    // 等待DOM更新后发送消息
    await nextTick();
  }
  
  // 由于ChatInterface组件中的sendMessage方法没有被暴露为公共方法
  // 我们需要通过通信方式传递消息
  
  // 方法1：使用组件实例方法（如果ChatInterface组件已暴露该方法）
  try {
    // 尝试直接访问方法
    if (chatInterface.value && 'sendMessage' in chatInterface.value) {
      (chatInterface.value as any).sendMessage(message);
      return;
    }
  } catch (e) {
    console.error('直接调用sendMessage方法失败', e);
  }
  
  // 方法2：通过事件总线
  const messageEvent = new CustomEvent('ai-chat-message', {
    detail: { message }
  });
  document.dispatchEvent(messageEvent);
  
  // 方法3：如果上述方法都失败，记录错误
  console.log('向AI助手发送消息:', message);
}

// 全局事件监听器，让应用的其他部分可以控制聊天窗口
onMounted(() => {
  // 创建自定义事件
  const eventBus = new EventTarget();
  
  // 监听事件
  eventBus.addEventListener('chat-open', () => expand());
  eventBus.addEventListener('chat-close', () => collapse());
  eventBus.addEventListener('chat-toggle-maximize', () => toggleSize());
  eventBus.addEventListener('chat-notification', () => { hasNotification.value = true; });
  
  // 监听消息发送事件
  eventBus.addEventListener('chat-send-message', (event) => {
    const customEvent = event as CustomEvent;
    if (customEvent.detail && customEvent.detail.message) {
      sendMessageToChat(customEvent.detail.message);
    }
  });
  
  // 添加全局访问点，使用类型断言确保TypeScript不会报错
  (window as any).aiChatAPI = publicAPI;
  (window as any).aiChatEvents = eventBus;
  
  // 清理函数，在组件卸载时移除全局引用
  onUnmounted(() => {
    if ('aiChatAPI' in window) {
      delete (window as any).aiChatAPI;
    }
    if ('aiChatEvents' in window) {
      delete (window as any).aiChatEvents;
    }
  });
});

// 声明全局类型（可选，用于类型检查）
declare global {
  interface Window {
    aiChatAPI?: typeof publicAPI;
    aiChatEvents?: EventTarget;
  }
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

/* 添加通知样式 */
.notification-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  width: 20px;
  height: 20px;
  background-color: red;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
  border: 2px solid white;
  z-index: 2;
}

.chat-button.notification {
  animation: attention-pulse 2s infinite;
}

@keyframes attention-pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(var(--el-color-primary-rgb), 0.7);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(var(--el-color-primary-rgb), 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(var(--el-color-primary-rgb), 0);
  }
}
</style> 