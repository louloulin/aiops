<template>
  <div class="chat-interface">
    <div class="chat-messages" ref="messagesContainer">
      <div v-if="messages.length === 0" class="welcome-placeholder">
        <!-- 简化的欢迎消息 -->
        <p>与 AI 助手开始对话</p>
        <div class="suggestion-chips-minimal">
          <button 
            v-for="suggestion in suggestions" 
            :key="suggestion"
            @click="sendMessage(suggestion)" 
            class="suggestion-chip-minimal"
          >
            {{ suggestion }}
          </button>
        </div>
      </div>
      
      <template v-for="(msg, index) in messages" :key="msg.id || index">
        <div v-if="shouldShowTimestamp(index)" class="timestamp-separator">
          {{ formatTimestampSeparator(msg.timestamp) }}
        </div>
        <div :class="['message-row', `message-${msg.role}`]">
          <!-- 助手消息：头像在左侧 -->
          <div v-if="msg.role === 'assistant'" class="avatar assistant-avatar">
            <i class="i-carbon-bot"></i>
          </div>
          <!-- 消息气泡 -->
          <div class="message-bubble">
            <div class="message-text" v-html="formatMessage(msg.content)"></div>
          </div>
          <!-- 用户消息：头像在右侧 -->
          <div v-if="msg.role === 'user'" class="avatar user-avatar">
            <i class="i-carbon-user-avatar"></i>
          </div>
        </div>
      </template>
      
      <!-- 输入指示器 -->
      <div v-if="isTyping" class="message-row message-assistant">
        <div class="avatar assistant-avatar">
          <i class="i-carbon-bot"></i>
        </div>
        <div class="message-bubble typing-indicator">
          <span></span><span></span><span></span>
        </div>
      </div>
    </div>
    
    <div class="chat-input-area">
      <textarea
        v-model="inputMessage"
        @keydown.enter.prevent="handleEnter"
        placeholder="输入消息..."
        rows="1"
        ref="inputField"
        class="input-field"
      ></textarea>
      <button 
        @click="sendMessage(inputMessage)" 
        :disabled="isTyping || !inputMessage.trim()"
        class="send-btn"
        :class="{ 'active': inputMessage.trim() }"
      >
        发送
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick, inject, onUnmounted } from 'vue';
import DOMPurify from 'dompurify';
import { toast } from 'vue-sonner';
import { useRouter, useRoute } from 'vue-router';
import axios from 'axios';

// Get routing information
const router = useRouter();
const route = useRoute();

// 获取全局状态
const globalState = inject('globalState', null) as {
  activeComponent: string | null;
  selectedData: any;
  activeFilters: Record<string, any>;
  setActiveComponent(id: string): void;
  setSelectedData(data: any): void;
  setFilter(componentId: string, filter: any): void;
} | null;

// Expose chat API methods for parent components
const chatAPI = inject('chatAPI', null);

// Define message type
interface Message {
  id?: string; // Add optional ID for keying
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

// State variables
const inputMessage = ref('');
const messages = ref<Message[]>([]);
const isTyping = ref(false);
const conversationId = ref<string | null>(null);
const messagesContainer = ref<HTMLElement | null>(null);
const inputField = ref<HTMLTextAreaElement | null>(null);

// Suggestions
const suggestions = [
  "CPU 使用率?",
  "异常日志?",
  "性能如何?",
  "优化建议?"
];

// Type for UI context information
interface UIContext {
  route: string;
  viewName?: string;
  componentId?: string;
  selectedData?: any;
  activeFilters?: any;
}

// Get current UI context
function getCurrentUIContext(): UIContext {
  const context: UIContext = {
    route: route.path,
    viewName: route.name as string,
  };
  
  // 如果全局状态可用，添加更多上下文数据
  if (globalState) {
    // 如果activeComponent为null，保留为null而不是转为undefined
    context.componentId = globalState.activeComponent;
    context.selectedData = globalState.selectedData;
    context.activeFilters = globalState.activeFilters;
  }
  
  return context;
}

// Execute UI action returned by the AI
function executeUIAction(action: any): void {
  console.log('执行UI操作:', action);
  
  if (!action || !action.action) return;
  
  switch (action.action) {
    case 'navigate':
      if (action.path) {
        router.push(action.path);
        toast.success(`正在导航到 ${action.path}`);
      }
      break;
      
    case 'filter': 
      if (action.componentId && action.criteria && globalState) {
        // 使用全局状态设置过滤器
        globalState.setFilter(action.componentId, action.criteria);
        toast.info(`已应用过滤器到 ${action.componentId}`);
      }
      break;
      
    case 'select':
      if (action.item && globalState) {
        // 使用全局状态选择项目
        globalState.setSelectedData(action.item);
        if (action.componentId) {
          globalState.setActiveComponent(action.componentId);
        }
        toast.info(`已选择项目`);
      }
      break;
      
    case 'refresh':
      // 刷新指定组件或当前页面
      if (action.componentId) {
        // 触发组件刷新
        window.dispatchEvent(new CustomEvent('component-refresh', { 
          detail: { componentId: action.componentId }
        }));
        toast.info(`正在刷新组件: ${action.componentId}`);
      } else {
        window.location.reload();
      }
      break;
      
    default:
      console.warn('未知UI操作类型:', action.action);
  }
}

// --- Message Handling ---
async function sendMessage(content: string) {
  const trimmedContent = content.trim();
  if (!trimmedContent || isTyping.value) return;
  
  inputMessage.value = ''; // Clear input first
  adjustInputHeight(); // Adjust height after clearing
  
  const userMessage: Message = {
    id: `msg-${Date.now()}-user`,
    role: 'user',
    content: trimmedContent,
    timestamp: new Date()
  };
  messages.value.push(userMessage);
  
  isTyping.value = true;
  scrollToBottom();
  
  try {
    // 获取当前UI上下文
    const context = getCurrentUIContext();
    console.log('当前UI上下文:', context);
    
    const apiBaseUrl = import.meta.env.VITE_API_URL || '';
    // 不使用流式API，改用普通API简化实现
    const endpoint = '/chat/send';
    
    // 常规HTTP请求
    const response = await axios.post(`${apiBaseUrl}${endpoint}`, {
      message: trimmedContent,
      conversationId: conversationId.value,
      context: context // 将UI上下文发送到API
    });
    
    conversationId.value = response.data.conversationId;
    
    const assistantMessage: Message = {
      id: `msg-${Date.now()}-assistant`,
      role: 'assistant',
      content: response.data.response,
      timestamp: new Date(response.data.timestamp || Date.now())
    };
    messages.value.push(assistantMessage);
    
    // 处理UI动作
    if (response.data.actions && Array.isArray(response.data.actions)) {
      response.data.actions.forEach((action: any) => {
        executeUIAction(action);
      });
    }
    
    isTyping.value = false;
  } catch (error) {
    console.error('发送消息失败:', error);
    toast.error('消息发送失败，请重试');
    messages.value.push({
      id: `msg-${Date.now()}-system`,
      role: 'system',
      content: '抱歉，无法连接到 AI 助手。',
      timestamp: new Date()
    });
    isTyping.value = false;
  } finally {
    await nextTick();
    scrollToBottom();
  }
}

// --- UI Helpers ---
function scrollToBottom() {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
  });
}

// Handle Enter key for sending, Shift+Enter for newline
function handleEnter(e: KeyboardEvent) {
  if (!e.shiftKey) {
    e.preventDefault();
    sendMessage(inputMessage.value);
  } 
  // Allow default behavior (newline) if Shift is pressed
}

function adjustInputHeight() {
  if (inputField.value) {
    inputField.value.style.height = 'auto'; // Reset height
    const scrollHeight = inputField.value.scrollHeight;
    // Max height approx 3 lines
    const maxHeight = 3 * parseFloat(getComputedStyle(inputField.value).lineHeight);
    inputField.value.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
  }
}

// Simple HTML formatting (replace with markdown if preferred)
function formatMessage(text: string): string {
  const htmlText = String(text || '') // Ensure text is a string
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>')
    .replace(/`([^`]+)`/g, '<code>$1</code>');
  // Consider a more robust markdown parser if complex formatting is needed
  return DOMPurify.sanitize(htmlText, { USE_PROFILES: { html: true } });
}

// --- Timestamp Logic ---
const TIME_THRESHOLD = 5 * 60 * 1000; // 5 minutes in milliseconds

function shouldShowTimestamp(index: number): boolean {
  if (index === 0) return true; // Always show for the first message
  const currentMsg = messages.value[index];
  const prevMsg = messages.value[index - 1];
  if (!currentMsg || !prevMsg) return false;
  return currentMsg.timestamp.getTime() - prevMsg.timestamp.getTime() > TIME_THRESHOLD;
}

function formatTimestampSeparator(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const oneDay = 24 * 60 * 60 * 1000;

  if (diff < oneDay && date.getDate() === now.getDate()) {
    // Today
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  } else if (diff < 2 * oneDay && date.getDate() === now.getDate() - 1) {
    // Yesterday
    return `昨天 ${date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`;
  } else {
    // Older date
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
}

// --- 初始化 ---
async function initializeChat() {
  try {
    // 创建新会话或加载现有会话
    if (!conversationId.value) {
      // 尝试从本地存储获取最后的会话ID
      const savedId = localStorage.getItem('lastChatConversationId');
      
      if (savedId) {
        conversationId.value = savedId;
        
        try {
          // 加载历史消息
          const apiBaseUrl = import.meta.env.VITE_API_URL || '';
          const response = await axios.get(`${apiBaseUrl}/chat/history/${savedId}`);
          if (response.data && response.data.history && Array.isArray(response.data.history)) {
            messages.value = response.data.history.map((msg: any) => ({
              ...msg,
              timestamp: new Date(msg.timestamp)
            }));
          }
        } catch (err) {
          console.error('加载聊天历史失败:', err);
          // 历史加载失败，创建新会话
          createNewSession();
        }
      } else {
        // 创建新会话
        createNewSession();
      }
    }
  } catch (error) {
    console.error('初始化聊天失败:', error);
    toast.error('初始化聊天失败, 使用本地模式');
    // 回退到本地会话ID
    conversationId.value = `local-${Date.now()}`;
  }
}

// 创建新的聊天会话
async function createNewSession() {
  try {
    const apiBaseUrl = import.meta.env.VITE_API_URL || '';
    const response = await axios.post(`${apiBaseUrl}/chat/sessions`);
    if (response.data && response.data.conversationId) {
      conversationId.value = response.data.conversationId;
      localStorage.setItem('lastChatConversationId', response.data.conversationId);
    }
  } catch (err) {
    console.error('创建新会话失败:', err);
    // 如果API调用失败，使用本地生成的会话ID
    conversationId.value = `local-${Date.now()}`;
    localStorage.setItem('lastChatConversationId', conversationId.value);
  }
}

// --- Lifecycle and Watchers ---
onMounted(async () => {
  await initializeChat();
  
  adjustInputHeight();
  scrollToBottom();
  if (inputField.value) {
    inputField.value.focus();
  }

  // Listen for external message events
  document.addEventListener('ai-chat-message', ((event: CustomEvent) => {
    if (event.detail && event.detail.message) {
      sendMessage(event.detail.message);
    }
  }) as EventListener);
});

watch(inputMessage, () => {
  nextTick(adjustInputHeight);
});

watch(messages, () => {
  scrollToBottom();
}, { deep: true });

// 当会话ID变化时，保存到本地存储
watch(conversationId, (newId) => {
  if (newId) {
    localStorage.setItem('lastChatConversationId', newId);
  }
});

// Clean up event listeners
onUnmounted(() => {
  document.removeEventListener('ai-chat-message', ((event: CustomEvent) => {
    // Same handler as above
  }) as EventListener);
});

// Make sendMessage available outside the component
defineExpose({
  sendMessage
});

</script>

<style scoped>
.chat-interface {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: #ededed; /* WeChat 风格背景色 */
  overflow: hidden;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px; /* 增加消息间距 */
}

.welcome-placeholder {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: #8c8c8c;
  padding: 20px;
}
.welcome-placeholder p {
  margin-bottom: 15px;
  font-size: 15px;
}

.suggestion-chips-minimal {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
  max-width: 90%;
}

.suggestion-chip-minimal {
  background-color: #ffffff;
  border: none;
  border-radius: 18px;
  padding: 8px 16px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;
  color: #07c160;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.suggestion-chip-minimal:hover {
  background-color: #f5f5f5;
}

.timestamp-separator {
  text-align: center;
  font-size: 13px;
  color: #8c8c8c;
  padding: 12px 0;
  margin: 5px 0;
}

.message-row {
  display: flex;
  margin-bottom: 16px;
  width: 100%; /* 修改宽度 */
  align-items: flex-start;
}

.message-user {
  justify-content: flex-end; /* 用户消息居右 */
}

.message-assistant {
  justify-content: flex-start; /* 助手消息居左 */
}

.message-system {
  justify-content: center;
  font-size: 13px;
  color: #8c8c8c;
  background-color: rgba(0,0,0,0.05);
  padding: 8px 16px;
  border-radius: 16px;
  margin: 8px 0;
  max-width: 80%;
  text-align: center;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 4px; /* WeChat 方形头像 */
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 22px;
  margin: 0 10px;
}

.assistant-avatar {
  background-color: #07c160; /* 微信绿 */
  color: white;
}

.user-avatar {
  background-color: #1890ff; /* 蓝色 */
  color: white;
}

.message-bubble {
  max-width: 70%; /* 气泡最大宽度 */
  padding: 12px 16px;
  border-radius: 4px;
  word-wrap: break-word;
  box-shadow: 0 1px 2px rgba(0,0,0,0.1);
  position: relative;
  line-height: 1.5;
  font-size: 15px;
}

.message-assistant .message-bubble {
  background-color: white;
  color: #333;
  border-top-left-radius: 0; /* 左上角尖角 */
}

.message-user .message-bubble {
  background-color: #95ec69; /* 亮绿色，微信经典色 */
  color: #333;
  border-top-right-radius: 0; /* 右上角尖角 */
}

.message-text {
  white-space: pre-wrap; /* 保留换行 */
}

.message-text :deep(code) {
  background-color: rgba(0, 0, 0, 0.06);
  padding: 2px 4px;
  border-radius: 4px;
  font-family: 'SFMono-Regular', Consolas, monospace;
  font-size: 0.9em;
}

.message-text :deep(pre) {
  background-color: rgba(0, 0, 0, 0.06);
  padding: 10px;
  border-radius: 4px;
  overflow-x: auto;
  margin: 8px 0;
  font-size: 13px;
}

.typing-indicator-row {
  align-items: center;
}

.typing-indicator {
  padding: 12px 16px;
  min-height: 20px;
}

.typing-indicator span {
  display: inline-block;
  width: 8px;
  height: 8px;
  margin: 0 2px;
  border-radius: 50%;
  background-color: #8c8c8c;
  opacity: 0.6;
  animation: typing-blink 1.2s infinite both;
}

.typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
.typing-indicator span:nth-child(3) { animation-delay: 0.4s; }

@keyframes typing-blink {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 1; }
}

.chat-input-area {
  display: flex;
  align-items: flex-end;
  padding: 10px 12px;
  border-top: 1px solid #e4e4e4;
  background-color: #f5f5f5; /* 微信输入区灰色 */
}

.input-field {
  flex: 1;
  border: none;
  border-radius: 4px;
  padding: 10px 12px;
  resize: none;
  background-color: white;
  font-family: inherit;
  font-size: 15px;
  line-height: 1.4;
  color: #333;
  max-height: 80px;
  overflow-y: auto;
  outline: none;
  margin-right: 10px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}

.send-btn {
  background-color: #f5f5f5;
  color: #8c8c8c;
  border: none;
  border-radius: 4px;
  padding: 8px 14px;
  font-size: 15px;
  cursor: pointer;
  transition: all 0.2s;
  height: 38px;
  line-height: 22px;
}

.send-btn.active {
  background-color: #07c160; /* 微信绿 */
  color: white;
}

.send-btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

/* Adjustments for dark mode if necessary */
/* Example:
.dark .chat-interface { background-color: #1a1a1a; }
.dark .message-assistant .message-bubble { background-color: #333; color: #eee; }
.dark .message-user .message-bubble { background-color: #0b4c8f; }
*/

</style> 