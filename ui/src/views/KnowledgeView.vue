<template>
  <div class="container mx-auto px-4 py-6">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-3xl font-bold text-white">Knowledge Graph</h1>
      <div class="flex items-center gap-4">
        <button class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
          Add Knowledge
        </button>
        <button class="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors">
          Import Data
        </button>
      </div>
    </div>
    
    <KnowledgeGraph />
  </div>
</template>

<script setup lang="ts">
import KnowledgeGraph from '../components/knowledge/KnowledgeGraph.vue';
</script> 