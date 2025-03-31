<script setup lang="ts">
import { ref, onMounted } from 'vue';
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

// 初始化网络图配置
const options = {
  nodes: {
    shape: 'dot',
    size: 16,
    font: {
      size: 14,
      color: '#FFFFFF'
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
      color: '#CCCCCC'
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

  const network = new Network(networkContainer.value, data, options);

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
    { id: '1', label: 'High CPU Usage', type: 'issue', group: 'issue' },
    { id: '2', label: 'Memory Leak', type: 'issue', group: 'issue' },
    { id: '3', label: 'Scale Up Resources', type: 'solution', group: 'solution' },
    { id: '4', label: 'Restart Service', type: 'solution', group: 'solution' },
    { id: '5', label: 'API Gateway', type: 'service', group: 'service' },
    { id: '6', label: 'Auth Service', type: 'service', group: 'service' },
    { id: '7', label: 'Load Balancer', type: 'component', group: 'component' },
    { id: '8', label: 'Cache Layer', type: 'component', group: 'component' }
  ];

  const edges: KnowledgeEdge[] = [
    { id: 'e1', from: '1', to: '3', label: 'resolved by' },
    { id: 'e2', from: '2', to: '4', label: 'resolved by' },
    { id: 'e3', from: '1', to: '5', label: 'affects' },
    { id: 'e4', from: '2', to: '6', label: 'affects' },
    { id: 'e5', from: '5', to: '7', label: 'uses' },
    { id: 'e6', from: '6', to: '8', label: 'uses' }
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
          placeholder="Search knowledge graph..."
          class="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          @keyup.enter="handleSearch"
        />
      </div>
      <button
        @click="handleSearch"
        class="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        :disabled="loading"
      >
        {{ loading ? 'Searching...' : 'Search' }}
      </button>
    </div>

    <!-- Graph Container -->
    <div class="grid grid-cols-3 gap-6">
      <!-- Network Visualization -->
      <div class="col-span-2 bg-gray-800 rounded-lg border border-gray-700 p-4">
        <div ref="networkContainer" class="w-full h-[600px]"></div>
      </div>

      <!-- Node Details -->
      <div class="bg-gray-800 rounded-lg border border-gray-700 p-4">
        <h3 class="text-lg font-semibold text-white mb-4">Node Details</h3>
        <div v-if="selectedNode" class="space-y-4">
          <div>
            <label class="text-sm text-gray-400">Type</label>
            <p class="text-white font-medium">{{ selectedNode.type }}</p>
          </div>
          <div>
            <label class="text-sm text-gray-400">Label</label>
            <p class="text-white font-medium">{{ selectedNode.label }}</p>
          </div>
          <!-- Additional node details can be added here -->
        </div>
        <div v-else class="text-gray-400 text-center py-8">
          Select a node to view details
        </div>
      </div>
    </div>

    <!-- Legend -->
    <div class="bg-gray-800 rounded-lg border border-gray-700 p-4">
      <h3 class="text-lg font-semibold text-white mb-4">Legend</h3>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="flex items-center gap-2">
          <div class="w-4 h-4 rounded-full bg-red-500"></div>
          <span class="text-gray-300">Issues</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-4 h-4 rounded-full bg-green-500"></div>
          <span class="text-gray-300">Solutions</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-4 h-4 rounded-full bg-blue-500"></div>
          <span class="text-gray-300">Components</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-4 h-4 rounded-full bg-yellow-500"></div>
          <span class="text-gray-300">Services</span>
        </div>
      </div>
    </div>
  </div>
</template> 