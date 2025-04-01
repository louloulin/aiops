<template>
  <div class="chat-container">
    <div class="chat-messages" ref="messagesContainer">
      <div v-if="messages.length === 0" class="welcome-message">
        <div class="welcome-icon">
          <i class="i-carbon-ai-status"></i>
        </div>
        <h3>AI 助手已准备就绪</h3>
        <p>您可以询问系统状态、日志分析、性能优化等任何运维相关问题</p>
        <div class="suggestion-chips">
          <button 
            v-for="suggestion in suggestions" 
            :key="suggestion"
            @click="sendMessage(suggestion)" 
            class="suggestion-chip"
          >
            {{ suggestion }}
          </button>
        </div>
      </div>
      
      <div v-for="(msg, index) in messages" :key="index" :class="['message', msg.role]">
        <div class="message-avatar">
          <i :class="msg.role === 'user' ? 'i-carbon-user-avatar' : 'i-carbon-bot'"></i>
        </div>
        <div class="message-content">
          <div class="message-text" v-html="formatMessage(msg.content)"></div>
          <div class="message-time">{{ formatTime(msg.timestamp) }}</div>
        </div>
      </div>
      
      <div v-if="isTyping" class="message assistant typing">
        <div class="message-avatar">
          <i class="i-carbon-bot"></i>
        </div>
        <div class="message-content">
          <div class="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    </div>
    
    <div class="chat-input">
      <textarea
        v-model="inputMessage"
        @keydown.enter.prevent="handleEnter"
        placeholder="输入您的问题..."
        rows="1"
        ref="inputField"
      ></textarea>
      <button 
        @click="sendMessage(inputMessage)" 
        :disabled="isTyping || !inputMessage.trim()"
        class="send-button"
      >
        <i class="i-carbon-send"></i>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue';
import DOMPurify from 'dompurify';
import { toast } from 'vue-sonner';
import axios from 'axios';

// 定义消息类型
interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

// 状态变量
const inputMessage = ref('');
const messages = ref<Message[]>([]);
const isTyping = ref(false);
const conversationId = ref<string | null>(null);
const messagesContainer = ref<HTMLElement | null>(null);
const inputField = ref<HTMLTextAreaElement | null>(null);

// 建议问题
const suggestions = [
  "系统 CPU 使用率如何？",
  "有哪些异常日志需要注意？",
  "请分析最近的系统性能问题",
  "如何优化数据库查询性能？",
  "显示当前系统告警"
];

// 发送消息
async function sendMessage(content: string) {
  if (!content.trim() || isTyping.value) return;
  
  // 清空输入框
  inputMessage.value = '';
  
  // 添加用户消息
  const userMessage: Message = {
    role: 'user',
    content,
    timestamp: new Date()
  };
  messages.value.push(userMessage);
  
  // 自动调整输入框高度
  adjustInputHeight();
  
  // 显示打字指示器
  isTyping.value = true;
  
  try {
    // 滚动到底部
    await nextTick();
    scrollToBottom();
    
    // 发送到API
    const response = await axios.post(`${import.meta.env.VITE_API_URL}/chat/send`, {
      message: content,
      conversationId: conversationId.value
    });
    
    // 保存会话ID
    conversationId.value = response.data.conversationId;
    
    // 添加助手回复
    const assistantMessage: Message = {
      role: 'assistant',
      content: response.data.response,
      timestamp: new Date(response.data.timestamp)
    };
    messages.value.push(assistantMessage);
    
    // 滚动到底部
    await nextTick();
    scrollToBottom();
  } catch (error) {
    console.error('发送消息失败:', error);
    toast.error('消息发送失败，请重试');
    
    // 添加错误消息
    messages.value.push({
      role: 'system',
      content: '消息发送失败，请重试',
      timestamp: new Date()
    });
  } finally {
    isTyping.value = false;
  }
}

// 处理回车键
function handleEnter(e: KeyboardEvent) {
  if (e.shiftKey) return; // Shift+Enter 允许换行
  sendMessage(inputMessage.value);
}

// 清空聊天
function clearChat() {
  messages.value = [];
  conversationId.value = null;
  inputMessage.value = '';
}

// 滚动到底部
function scrollToBottom() {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
}

// 自动调整输入框高度
function adjustInputHeight() {
  if (inputField.value) {
    inputField.value.style.height = 'auto';
    inputField.value.style.height = `${Math.min(inputField.value.scrollHeight, 150)}px`;
  }
}

// 格式化消息文本
function formatMessage(text: string): string {
  // 将换行符转换为<br>
  const htmlText = text
    .replace(/\n/g, '<br>')
    .replace(/`([^`]+)`/g, '<code>$1</code>');
  return DOMPurify.sanitize(htmlText);
}

// 格式化时间
function formatTime(date: Date) {
  if (!(date instanceof Date)) {
    date = new Date(date);
  }
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
}

// 监听输入框内容变化自动调整高度
watch(inputMessage, () => {
  nextTick(adjustInputHeight);
});

onMounted(() => {
  // 初始化输入框高度
  adjustInputHeight();
  // 滚动到底部
  scrollToBottom();
  // 自动聚焦输入框
  if (inputField.value) {
    inputField.value.focus();
  }
});
</script>

<style scoped>
.chat-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: var(--el-bg-color);
  overflow: hidden;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.welcome-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  height: 100%;
  color: var(--el-text-color-secondary);
  padding: 0 16px;
}

.welcome-icon {
  font-size: 36px;
  margin-bottom: 12px;
  color: var(--el-color-primary);
}

.welcome-message h3 {
  margin: 0 0 12px;
  font-weight: 500;
  font-size: 16px;
}

.welcome-message p {
  margin: 0 0 16px;
  max-width: 280px;
  font-size: 14px;
}

.suggestion-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
  max-width: 280px;
}

.suggestion-chip {
  background-color: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-light);
  border-radius: 16px;
  padding: 4px 12px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s;
  color: var(--el-text-color-primary);
}

.suggestion-chip:hover {
  background-color: var(--el-color-primary-light-9);
  border-color: var(--el-color-primary-light-5);
  color: var(--el-color-primary);
}

.message {
  display: flex;
  gap: 8px;
  max-width: 85%;
}

.message.user {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.message.assistant {
  align-self: flex-start;
}

.message.system {
  align-self: center;
  background-color: var(--el-color-warning-light-9);
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 12px;
  color: var(--el-color-warning-dark-2);
}

.message-avatar {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  flex-shrink: 0;
}

.message.user .message-avatar {
  background-color: var(--el-color-success-light-9);
  color: var(--el-color-success);
}

.message.assistant .message-avatar {
  background-color: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}

.message-avatar i {
  font-size: 14px;
}

.message-content {
  background-color: var(--el-fill-color-light);
  padding: 8px 12px;
  border-radius: 8px;
  position: relative;
  font-size: 14px;
}

.message.user .message-content {
  background-color: var(--el-color-primary-light-9);
  color: var(--el-text-color-primary);
}

.message-text {
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.4;
}

.message-time {
  font-size: 10px;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
  text-align: right;
}

.message-text :deep(code) {
  background-color: var(--el-fill-color);
  padding: 2px 4px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 0.9em;
}

.message-text :deep(pre) {
  background-color: var(--el-fill-color);
  padding: 8px;
  border-radius: 4px;
  overflow-x: auto;
  margin: 6px 0;
  font-size: 12px;
}

.message-text :deep(pre code) {
  background-color: transparent;
  padding: 0;
}

.typing-indicator {
  display: flex;
  gap: 4px;
  padding: 6px 0;
}

.typing-indicator span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: var(--el-text-color-secondary);
  opacity: 0.5;
  animation: typing 1.4s infinite both;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0% { transform: scale(0.5); opacity: 0.5; }
  50% { transform: scale(1); opacity: 1; }
  100% { transform: scale(0.5); opacity: 0.5; }
}

.chat-input {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  padding: 12px;
  border-top: 1px solid var(--el-border-color-light);
  background-color: var(--el-bg-color);
}

textarea {
  flex: 1;
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  padding: 6px 10px;
  resize: none;
  max-height: 100px;
  background-color: var(--el-fill-color-blank);
  font-family: inherit;
  font-size: 13px;
  line-height: 1.4;
  color: var(--el-text-color-primary);
  transition: all 0.3s;
}

textarea:focus {
  outline: none;
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 2px var(--el-color-primary-light-8);
}

.send-button {
  background-color: var(--el-color-primary);
  color: white;
  border: none;
  border-radius: 4px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s;
  flex-shrink: 0;
}

.send-button:hover {
  background-color: var(--el-color-primary-dark-1);
}

.send-button:disabled {
  background-color: var(--el-fill-color);
  color: var(--el-text-color-placeholder);
  cursor: not-allowed;
}
</style> 