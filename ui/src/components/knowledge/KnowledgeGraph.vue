<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { Network } from 'vis-network';
import { DataSet } from 'vis-data';

interface KnowledgeNode {
  id: string;
  label: string;
  type: 'issue' | 'solution' | 'component' | 'service';
  group: string;
}

interface KnowledgeEdge {
  id: string;
  from: string;
  to: string;
  label: string;
}

// State
const searchQuery = ref('');
const selectedNode = ref<KnowledgeNode | null>(null);
const loading = ref(false);

// Network container ref
const networkContainer = ref<HTMLElement | null>(null);

// API基础URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:9700/api';

// 检测是否为暗色模式
const isDarkMode = computed(() => {
  return document.documentElement.classList.contains('dark');
});

// 初始化网络图配置
const getNetworkOptions = () => {
  return {
    nodes: {
      shape: 'dot',
      size: 16,
      font: {
        size: 14,
        color: isDarkMode.value ? '#FFFFFF' : '#333333'
      },
      borderWidth: 2,
      shadow: true
    },
    edges: {
      width: 2,
      color: { inherit: 'both' },
      smooth: {
        type: 'continuous'
      },
      font: {
        size: 12,
        color: isDarkMode.value ? '#CCCCCC' : '#666666'
      }
    },
    groups: {
      issue: {
        color: { background: '#EF4444', border: '#DC2626' }
      },
      solution: {
        color: { background: '#10B981', border: '#059669' }
      },
      component: {
        color: { background: '#6366F1', border: '#4F46E5' }
      },
      service: {
        color: { background: '#F59E0B', border: '#D97706' }
      }
    },
    physics: {
      stabilization: false,
      barnesHut: {
        gravitationalConstant: -80000,
        springConstant: 0.001,
        springLength: 200
      }
    }
  };
};

// 获取知识图谱数据
const fetchKnowledgeGraph = async () => {
  try {
    loading.value = true;
    const response = await fetch(`${API_BASE_URL}/knowledge/graph?q=${searchQuery.value}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch knowledge graph data');
    }

    const data = await response.json();
    
    if (data.success) {
      initNetwork(data.nodes, data.edges);
    }
  } catch (error) {
    console.error('Error fetching knowledge graph:', error);
    // 开发环境使用模拟数据
    if (import.meta.env.DEV) {
      generateMockData();
    }
  } finally {
    loading.value = false;
  }
};

// 初始化网络图
const initNetwork = (nodes: KnowledgeNode[], edges: KnowledgeEdge[]) => {
  if (!networkContainer.value) return;

  const nodesDataSet = new DataSet(nodes);
  const edgesDataSet = new DataSet(edges);

  const data = {
    nodes: nodesDataSet,
    edges: edgesDataSet
  };

  const network = new Network(networkContainer.value, data, getNetworkOptions());

  network.on('selectNode', (params) => {
    const node = nodes.find(n => n.id === params.nodes[0]);
    if (node) {
      selectedNode.value = node;
    }
  });

  network.on('deselectNode', () => {
    selectedNode.value = null;
  });
};

// 生成模拟数据
const generateMockData = () => {
  const nodes: KnowledgeNode[] = [
    { id: '1', label: '高CPU使用率', type: 'issue', group: 'issue' },
    { id: '2', label: '内存泄漏', type: 'issue', group: 'issue' },
    { id: '3', label: '增加资源', type: 'solution', group: 'solution' },
    { id: '4', label: '重启服务', type: 'solution', group: 'solution' },
    { id: '5', label: 'API网关', type: 'service', group: 'service' },
    { id: '6', label: '身份验证服务', type: 'service', group: 'service' },
    { id: '7', label: '负载均衡器', type: 'component', group: 'component' },
    { id: '8', label: '缓存层', type: 'component', group: 'component' }
  ];

  const edges: KnowledgeEdge[] = [
    { id: 'e1', from: '1', to: '3', label: '解决方案' },
    { id: 'e2', from: '2', to: '4', label: '解决方案' },
    { id: 'e3', from: '1', to: '5', label: '影响' },
    { id: 'e4', from: '2', to: '6', label: '影响' },
    { id: 'e5', from: '5', to: '7', label: '使用' },
    { id: 'e6', from: '6', to: '8', label: '使用' }
  ];

  initNetwork(nodes, edges);
};

// 搜索知识图谱
const handleSearch = () => {
  fetchKnowledgeGraph();
};

// 初始化
onMounted(() => {
  fetchKnowledgeGraph();
  
  // 监听主题变化
  const observer = new MutationObserver(() => {
    if (networkContainer.value) {
      fetchKnowledgeGraph();
    }
  });
  
  observer.observe(document.documentElement, { 
    attributes: true, 
    attributeFilter: ['class'] 
  });
});
</script>

<template>
  <div class="space-y-6">
    <!-- Search Bar -->
    <div class="flex gap-4">
      <div class="flex-1">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="搜索知识图谱..."
          class="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          @keyup.enter="handleSearch"
        />
      </div>
      <button
        @click="handleSearch"
        class="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        :disabled="loading"
      >
        {{ loading ? '搜索中...' : '搜索' }}
      </button>
    </div>

    <!-- Graph Container -->
    <div class="grid grid-cols-3 gap-6">
      <!-- Network Visualization -->
      <div class="col-span-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
        <div ref="networkContainer" class="w-full h-[600px]"></div>
      </div>

      <!-- Node Details -->
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">节点详情</h3>
        <div v-if="selectedNode" class="space-y-4">
          <div>
            <label class="text-sm text-gray-500 dark:text-gray-400">类型</label>
            <p class="text-gray-900 dark:text-white font-medium">{{ selectedNode.type }}</p>
          </div>
          <div>
            <label class="text-sm text-gray-500 dark:text-gray-400">标签</label>
            <p class="text-gray-900 dark:text-white font-medium">{{ selectedNode.label }}</p>
          </div>
          <!-- Additional node details can be added here -->
        </div>
        <div v-else class="text-gray-500 dark:text-gray-400 text-center py-8">
          选择一个节点查看详情
        </div>
      </div>
    </div>

    <!-- Legend -->
    <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">图例</h3>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="flex items-center gap-2">
          <div class="w-4 h-4 rounded-full bg-red-500"></div>
          <span class="text-gray-700 dark:text-gray-300">问题</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-4 h-4 rounded-full bg-green-500"></div>
          <span class="text-gray-700 dark:text-gray-300">解决方案</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-4 h-4 rounded-full bg-blue-500"></div>
          <span class="text-gray-700 dark:text-gray-300">组件</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-4 h-4 rounded-full bg-yellow-500"></div>
          <span class="text-gray-700 dark:text-gray-300">服务</span>
        </div>
      </div>
    </div>
  </div>
</template> 