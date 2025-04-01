<template>
  <div class="ai-assistant-container">
    <h1 class="page-title">AI 助手</h1>
    <div class="chat-wrapper">
      <ChatInterface />
    </div>
  </div>
</template>

<script setup lang="ts">
import ChatInterface from '../components/chat/ChatInterface.vue';
</script>

<style scoped>
.ai-assistant-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 20px;
}

.page-title {
  margin-top: 0;
  margin-bottom: 20px;
  font-size: 24px;
  font-weight: 500;
}

.chat-wrapper {
  flex: 1;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}
</style> 