<!-- KnowledgeDashboard.vue -->
<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <h2 class="text-2xl font-bold">Knowledge Base</h2>
      <div class="flex space-x-2">
        <div class="relative">
          <input v-model="searchQuery"
                 type="text"
                 placeholder="Search knowledge base..."
                 class="w-64 rounded-md border bg-background px-3 py-2 pr-10" />
          <button @click="search"
                  class="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            🔍
          </button>
        </div>
        <button @click="openAddArticleModal" 
                class="rounded-md bg-primary text-primary-foreground px-4 py-2">
          Add Article
        </button>
      </div>
    </div>

    <!-- Knowledge Articles -->
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <div v-for="article in articles" :key="article.id"
           class="rounded-lg border bg-card p-4 hover:border-primary cursor-pointer"
           @click="openArticle(article)">
        <h3 class="text-lg font-semibold mb-2">{{ article.title }}</h3>
        <p class="text-sm text-muted-foreground line-clamp-2">{{ article.summary }}</p>
        <div class="mt-4 flex items-center justify-between">
          <div class="flex flex-wrap gap-2">
            <span v-for="tag in article.tags" :key="tag"
                  class="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-full">
              {{ tag }}
            </span>
          </div>
          <span class="text-xs text-muted-foreground">
            {{ formatDate(article.updatedAt) }}
          </span>
        </div>
      </div>
    </div>

    <!-- Article Modal -->
    <div v-if="selectedArticle" class="fixed inset-0 bg-background/80 backdrop-blur-sm">
      <div class="fixed inset-x-0 top-16 bottom-16 z-50 w-full max-w-4xl mx-auto p-6 rounded-lg border bg-card shadow-lg overflow-auto">
        <div class="flex justify-between items-start mb-6">
          <h3 class="text-2xl font-semibold">{{ selectedArticle.title }}</h3>
          <button @click="selectedArticle = null" class="text-muted-foreground hover:text-foreground">
            ✕
          </button>
        </div>
        <div class="prose prose-sm max-w-none">
          {{ selectedArticle.content }}
        </div>
        <div class="mt-6 pt-6 border-t">
          <h4 class="font-medium mb-2">Related Articles</h4>
          <div class="space-y-2">
            <a v-for="related in selectedArticle.related" :key="related.id"
               href="#"
               class="block text-sm text-primary hover:underline">
              {{ related.title }}
            </a>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Article Modal -->
    <div v-if="showAddModal" class="fixed inset-0 bg-background/80 backdrop-blur-sm">
      <div class="fixed inset-x-0 top-16 z-50 w-full max-w-2xl mx-auto p-6 rounded-lg border bg-card shadow-lg">
        <h3 class="text-lg font-semibold mb-4">Add Knowledge Article</h3>
        <form @submit.prevent="submitArticle" class="space-y-4">
          <div class="space-y-2">
            <label class="text-sm font-medium">Title</label>
            <input v-model="newArticle.title"
                   type="text"
                   class="w-full rounded-md border bg-background px-3 py-2"
                   required />
          </div>
          <div class="space-y-2">
            <label class="text-sm font-medium">Content</label>
            <textarea v-model="newArticle.content"
                      rows="10"
                      class="w-full rounded-md border bg-background px-3 py-2"
                      required></textarea>
          </div>
          <div class="space-y-2">
            <label class="text-sm font-medium">Tags (comma separated)</label>
            <input v-model="newArticle.tags"
                   type="text"
                   class="w-full rounded-md border bg-background px-3 py-2" />
          </div>
          <div class="flex justify-end space-x-2">
            <button type="button"
                    @click="showAddModal = false"
                    class="rounded-md border px-4 py-2">
              Cancel
            </button>
            <button type="submit"
                    class="rounded-md bg-primary text-primary-foreground px-4 py-2">
              Save Article
            </button>
          </div>
        </form>
      </div>
    </div>

    <div v-if="error" class="rounded-md bg-destructive/10 text-destructive p-4">
      {{ error }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

interface Article {
  id: string;
  title: string;
  content: string;
  summary: string;
  tags: string[];
  updatedAt: string;
  related?: Array<{ id: string; title: string }>;
}

interface NewArticle {
  title: string;
  content: string;
  tags: string;
}

const articles = ref<Article[]>([]);
const selectedArticle = ref<Article | null>(null);
const error = ref<string | null>(null);
const searchQuery = ref('');
const showAddModal = ref(false);
const newArticle = ref<NewArticle>({
  title: '',
  content: '',
  tags: '',
});

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString();
};

const fetchArticles = async () => {
  try {
    error.value = null;
    const response = await fetch('http://localhost:3000/api/knowledge');
    if (!response.ok) {
      throw new Error('Failed to fetch articles');
    }
    articles.value = await response.json();
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'An error occurred';
    console.error('Error fetching articles:', err);
  }
};

const search = async () => {
  try {
    error.value = null;
    const response = await fetch(`http://localhost:3000/api/knowledge/search?q=${encodeURIComponent(searchQuery.value)}`);
    if (!response.ok) {
      throw new Error('Failed to search articles');
    }
    articles.value = await response.json();
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'An error occurred';
    console.error('Error searching articles:', err);
  }
};

const openArticle = async (article: Article) => {
  try {
    error.value = null;
    const response = await fetch(`http://localhost:3000/api/knowledge/${article.id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch article details');
    }
    selectedArticle.value = await response.json();
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'An error occurred';
    console.error('Error fetching article details:', err);
  }
};

const submitArticle = async () => {
  try {
    error.value = null;
    const response = await fetch('http://localhost:3000/api/knowledge', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...newArticle.value,
        tags: newArticle.value.tags.split(',').map(tag => tag.trim()).filter(Boolean),
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create article');
    }

    showAddModal.value = false;
    await fetchArticles();
    newArticle.value = {
      title: '',
      content: '',
      tags: '',
    };
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'An error occurred';
    console.error('Error creating article:', err);
  }
};

const openAddArticleModal = () => {
  showAddModal.value = true;
};

onMounted(() => {
  fetchArticles();
});
</script> 