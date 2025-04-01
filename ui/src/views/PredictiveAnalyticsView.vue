<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import Chart from 'chart.js/auto';
import axios from 'axios';

// 定义类型
interface SystemMetric {
  timestamp?: string;
  createdAt?: string;
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkTraffic: number;
}

interface Anomaly {
  timestamp: string;
  metric: 'cpu' | 'memory' | 'disk' | 'network';
  value: number;
  threshold: number;
  probability: number;
  impact: 'high' | 'medium' | 'low';
}

interface Solution {
  metric: string;
  suggestions: string[];
  automatedActions: string[];
}

// 图表引用
const cpuChart = ref<HTMLCanvasElement | null>(null);
const memoryChart = ref<HTMLCanvasElement | null>(null);
const diskChart = ref<HTMLCanvasElement | null>(null);
const networkChart = ref<HTMLCanvasElement | null>(null);

// 图表实例
let cpuChartInstance: Chart | null = null;
let memoryChartInstance: Chart | null = null;
let diskChartInstance: Chart | null = null;
let networkChartInstance: Chart | null = null;

// 状态变量
const isLoading = ref(false);
const timeRange = ref('24h');
const predictionHorizon = ref('24h');
const historicalData = ref<SystemMetric[]>([]);
const predictedData = ref<SystemMetric[]>([]);
const anomalies = ref<{
  cpu: Anomaly[];
  memory: Anomaly[];
  disk: Anomaly[];
  network: Anomaly[];
}>({
  cpu: [],
  memory: [],
  disk: [],
  network: []
});
const solutions = ref<Solution[]>([]);
const confidence = ref(0);

// 当前值和峰值
const currentValues = ref({
  cpu: 0,
  memory: 0,
  disk: 0,
  network: 0
});

const peakValues = ref({
  cpu: 0,
  memory: 0,
  disk: 0,
  network: 0
});

// 计算所有异常的展平列表
const allAnomalies = computed<Anomaly[]>(() => {
  return [
    ...anomalies.value.cpu,
    ...anomalies.value.memory,
    ...anomalies.value.disk,
    ...anomalies.value.network
  ].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
});

// 是否有异常
const hasAnomalies = computed(() => {
  return allAnomalies.value.length > 0;
});

// 预测总结信息
const predictionSummary = computed(() => {
  if (allAnomalies.value.length === 0) {
    return {
      type: 'success',
      icon: 'check_circle',
      title: '系统稳定',
      message: '根据当前数据分析，预测系统在未来时间内将保持稳定运行，无明显异常。'
    };
  }

  // 检查是否有高影响力的异常
  const highImpactAnomalies = allAnomalies.value.filter(a => a.impact === 'high');
  if (highImpactAnomalies.length > 0) {
    return {
      type: 'error',
      icon: 'error',
      title: '潜在系统风险',
      message: `预测在未来${predictionHorizon.value}内，系统可能出现${highImpactAnomalies.length}个严重异常，建议及时处理。`
    };
  }

  // 检查是否有中等影响力的异常
  const mediumImpactAnomalies = allAnomalies.value.filter(a => a.impact === 'medium');
  if (mediumImpactAnomalies.length > 0) {
    return {
      type: 'warning',
      icon: 'warning',
      title: '性能波动预警',
      message: `预测在未来${predictionHorizon.value}内，系统可能出现${mediumImpactAnomalies.length}个中等异常，建议关注系统性能。`
    };
  }

  // 低影响力异常
  return {
    type: 'info',
    icon: 'info',
    title: '轻微异常提示',
    message: `预测在未来${predictionHorizon.value}内，系统可能出现${allAnomalies.value.length}个轻微异常，系统整体运行良好。`
  };
});

// 格式化时间
const formatDateTime = (timestamp: string): string => {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

// 格式化值
const formatValue = (value: number, unit: string): string => {
  if (value === undefined || value === null) return 'N/A';
  return `${Math.round(value * 10) / 10} ${unit}`;
};

// 获取峰值类名
const getPeakClass = (value: number, threshold: number): string => {
  if (value > threshold * 1.2) return 'error';
  if (value > threshold) return 'warning';
  return 'normal';
};

// 获取指标名称
const getMetricName = (metric: string): string => {
  const names: Record<string, string> = {
    cpu: 'CPU使用率',
    memory: '内存使用率',
    disk: '磁盘使用率',
    network: '网络流量'
  };
  return names[metric] || metric;
};

// 获取指标单位
const getMetricUnit = (metric: string): string => {
  const units: Record<string, string> = {
    cpu: '%',
    memory: '%',
    disk: '%',
    network: 'MB/s'
  };
  return units[metric] || '';
};

// 获取影响力文本
const getImpactText = (impact: string): string => {
  const texts: Record<string, string> = {
    high: '高影响',
    medium: '中等影响',
    low: '低影响'
  };
  return texts[impact] || impact;
};

// 获取数据
const fetchData = async () => {
  isLoading.value = true;
  try {
    const response = await axios.get('/api/analytics/predict', {
      params: {
        timeRange: timeRange.value,
        predictionHorizon: predictionHorizon.value
      }
    });

    const { historicalData: history, predictedData: prediction, anomalies: detectedAnomalies, solutions: suggestedSolutions, confidence: predictionConfidence } = response.data;

    historicalData.value = history || [];
    predictedData.value = prediction || [];
    confidence.value = predictionConfidence || 0;

    // 分类异常
    anomalies.value = {
      cpu: (detectedAnomalies || []).filter((a: any) => a.metric === 'cpu'),
      memory: (detectedAnomalies || []).filter((a: any) => a.metric === 'memory'),
      disk: (detectedAnomalies || []).filter((a: any) => a.metric === 'disk'),
      network: (detectedAnomalies || []).filter((a: any) => a.metric === 'network')
    };

    solutions.value = suggestedSolutions || [];

    // 设置当前值
    if (historicalData.value.length > 0) {
      const latest = historicalData.value[0]; // 假设数据是按时间降序排列的
      currentValues.value = {
        cpu: latest.cpuUsage,
        memory: latest.memoryUsage,
        disk: latest.diskUsage,
        network: latest.networkTraffic
      };
    }

    // 计算预测峰值
    if (predictedData.value.length > 0) {
      peakValues.value = {
        cpu: Math.max(...predictedData.value.map(d => d.cpuUsage)),
        memory: Math.max(...predictedData.value.map(d => d.memoryUsage)),
        disk: Math.max(...predictedData.value.map(d => d.diskUsage)),
        network: Math.max(...predictedData.value.map(d => d.networkTraffic))
      };
    }

    // 更新图表
    updateCharts();
  } catch (error) {
    console.error('获取预测数据失败:', error);
    console.error('获取预测数据失败，请稍后重试');
  } finally {
    isLoading.value = false;
  }
};

// 更新图表
const updateCharts = () => {
  updateCpuChart();
  updateMemoryChart();
  updateDiskChart();
  updateNetworkChart();
};

// 更新CPU图表
const updateCpuChart = () => {
  if (cpuChartInstance) {
    cpuChartInstance.destroy();
  }

  if (!cpuChart.value) return;

  // 准备数据
  const labels = [
    ...historicalData.value.map(d => new Date(d.timestamp || d.createdAt || '')),
    ...predictedData.value.map(d => new Date(d.timestamp || ''))
  ];

  const historicalValues = historicalData.value.map(d => d.cpuUsage);
  const predictedValues = predictedData.value.map(d => d.cpuUsage);

  // 创建图表
  cpuChartInstance = new Chart(cpuChart.value, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: '历史数据',
          data: [...historicalValues, ...Array(predictedValues.length).fill(null)],
          borderColor: '#2c3e50',
          backgroundColor: 'rgba(44, 62, 80, 0.1)',
          borderWidth: 2,
          tension: 0.2,
          pointRadius: 2
        },
        {
          label: '预测数据',
          data: [...Array(historicalValues.length).fill(null), ...predictedValues],
          borderColor: '#3498db',
          backgroundColor: 'rgba(52, 152, 219, 0.1)',
          borderWidth: 2,
          borderDash: [5, 5],
          tension: 0.2,
          pointRadius: 2
        }
      ]
    },
    options: {
      responsive: true,
      interaction: {
        mode: 'index' as const,
        intersect: false
      },
      scales: {
        x: {
          type: 'time',
          time: {
            unit: getTimeUnit(),
            tooltipFormat: 'yyyy-MM-dd HH:mm'
          },
          title: {
            display: true,
            text: '时间'
          }
        },
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'CPU使用率 (%)'
          },
          suggestedMax: 100
        }
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: function(context) {
              return `${context.dataset.label}: ${context.parsed.y.toFixed(1)}%`;
            }
          }
        },
        legend: {
          position: 'top'
        }
      }
    }
  });
};

// 更新内存图表
const updateMemoryChart = () => {
  if (memoryChartInstance) {
    memoryChartInstance.destroy();
  }

  if (!memoryChart.value) return;

  // 准备数据
  const labels = [
    ...historicalData.value.map(d => new Date(d.timestamp || d.createdAt || '')),
    ...predictedData.value.map(d => new Date(d.timestamp || ''))
  ];

  const historicalValues = historicalData.value.map(d => d.memoryUsage);
  const predictedValues = predictedData.value.map(d => d.memoryUsage);

  // 创建图表
  memoryChartInstance = new Chart(memoryChart.value, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: '历史数据',
          data: [...historicalValues, ...Array(predictedValues.length).fill(null)],
          borderColor: '#2c3e50',
          backgroundColor: 'rgba(44, 62, 80, 0.1)',
          borderWidth: 2,
          tension: 0.2,
          pointRadius: 2
        },
        {
          label: '预测数据',
          data: [...Array(historicalValues.length).fill(null), ...predictedValues],
          borderColor: '#e74c3c',
          backgroundColor: 'rgba(231, 76, 60, 0.1)',
          borderWidth: 2,
          borderDash: [5, 5],
          tension: 0.2,
          pointRadius: 2
        }
      ]
    },
    options: {
      responsive: true,
      interaction: {
        mode: 'index' as const,
        intersect: false
      },
      scales: {
        x: {
          type: 'time',
          time: {
            unit: getTimeUnit(),
            tooltipFormat: 'yyyy-MM-dd HH:mm'
          },
          title: {
            display: true,
            text: '时间'
          }
        },
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: '内存使用率 (%)'
          },
          suggestedMax: 100
        }
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: function(context) {
              return `${context.dataset.label}: ${context.parsed.y.toFixed(1)}%`;
            }
          }
        },
        legend: {
          position: 'top'
        }
      }
    }
  });
};

// 更新磁盘图表
const updateDiskChart = () => {
  if (diskChartInstance) {
    diskChartInstance.destroy();
  }

  if (!diskChart.value) return;

  // 准备数据
  const labels = [
    ...historicalData.value.map(d => new Date(d.timestamp || d.createdAt || '')),
    ...predictedData.value.map(d => new Date(d.timestamp || ''))
  ];

  const historicalValues = historicalData.value.map(d => d.diskUsage);
  const predictedValues = predictedData.value.map(d => d.diskUsage);

  // 创建图表
  diskChartInstance = new Chart(diskChart.value, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: '历史数据',
          data: [...historicalValues, ...Array(predictedValues.length).fill(null)],
          borderColor: '#2c3e50',
          backgroundColor: 'rgba(44, 62, 80, 0.1)',
          borderWidth: 2,
          tension: 0.2,
          pointRadius: 2
        },
        {
          label: '预测数据',
          data: [...Array(historicalValues.length).fill(null), ...predictedValues],
          borderColor: '#f39c12',
          backgroundColor: 'rgba(243, 156, 18, 0.1)',
          borderWidth: 2,
          borderDash: [5, 5],
          tension: 0.2,
          pointRadius: 2
        }
      ]
    },
    options: {
      responsive: true,
      interaction: {
        mode: 'index' as const,
        intersect: false
      },
      scales: {
        x: {
          type: 'time',
          time: {
            unit: getTimeUnit(),
            tooltipFormat: 'yyyy-MM-dd HH:mm'
          },
          title: {
            display: true,
            text: '时间'
          }
        },
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: '磁盘使用率 (%)'
          },
          suggestedMax: 100
        }
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: function(context) {
              return `${context.dataset.label}: ${context.parsed.y.toFixed(1)}%`;
            }
          }
        },
        legend: {
          position: 'top'
        }
      }
    }
  });
};

// 更新网络图表
const updateNetworkChart = () => {
  if (networkChartInstance) {
    networkChartInstance.destroy();
  }

  if (!networkChart.value) return;

  // 准备数据
  const labels = [
    ...historicalData.value.map(d => new Date(d.timestamp || d.createdAt || '')),
    ...predictedData.value.map(d => new Date(d.timestamp || ''))
  ];

  const historicalValues = historicalData.value.map(d => d.networkTraffic);
  const predictedValues = predictedData.value.map(d => d.networkTraffic);

  // 创建图表
  networkChartInstance = new Chart(networkChart.value, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: '历史数据',
          data: [...historicalValues, ...Array(predictedValues.length).fill(null)],
          borderColor: '#2c3e50',
          backgroundColor: 'rgba(44, 62, 80, 0.1)',
          borderWidth: 2,
          tension: 0.2,
          pointRadius: 2
        },
        {
          label: '预测数据',
          data: [...Array(historicalValues.length).fill(null), ...predictedValues],
          borderColor: '#9b59b6',
          backgroundColor: 'rgba(155, 89, 182, 0.1)',
          borderWidth: 2,
          borderDash: [5, 5],
          tension: 0.2,
          pointRadius: 2
        }
      ]
    },
    options: {
      responsive: true,
      interaction: {
        mode: 'index' as const,
        intersect: false
      },
      scales: {
        x: {
          type: 'time',
          time: {
            unit: getTimeUnit(),
            tooltipFormat: 'yyyy-MM-dd HH:mm'
          },
          title: {
            display: true,
            text: '时间'
          }
        },
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: '网络流量 (MB/s)'
          }
        }
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: function(context) {
              return `${context.dataset.label}: ${context.parsed.y.toFixed(1)} MB/s`;
            }
          }
        },
        legend: {
          position: 'top'
        }
      }
    }
  });
};

// 根据时间范围获取时间单位
const getTimeUnit = (): 'hour' | 'day' => {
  if (timeRange.value === '24h' || timeRange.value === '3d') {
    return 'hour';
  } else {
    return 'day';
  }
};

// 当组件挂载时获取数据
onMounted(() => {
  fetchData();
});

// 当时间范围或预测范围改变时重新获取数据
watch([timeRange, predictionHorizon], () => {
  fetchData();
});
</script>

<template>
  <div class="predictive-analytics-container">
    <div class="header-section">
      <h1 class="page-title">智能预测分析</h1>
      <div class="header-actions">
        <div class="time-range-selector">
          <label for="timeRange">历史数据范围:</label>
          <select id="timeRange" v-model="timeRange" @change="fetchData">
            <option value="24h">过去24小时</option>
            <option value="3d">过去3天</option>
            <option value="7d">过去7天</option>
            <option value="30d">过去30天</option>
          </select>
        </div>
        <div class="prediction-horizon-selector">
          <label for="predictionHorizon">预测时间范围:</label>
          <select id="predictionHorizon" v-model="predictionHorizon" @change="fetchData">
            <option value="6h">未来6小时</option>
            <option value="12h">未来12小时</option>
            <option value="24h">未来24小时</option>
            <option value="3d">未来3天</option>
          </select>
        </div>
        <button class="refresh-button" @click="fetchData" :disabled="isLoading">
          <span v-if="isLoading">分析中...</span>
          <span v-else>刷新数据</span>
        </button>
      </div>
    </div>

    <div class="prediction-summary" v-if="predictionSummary.message">
      <div class="summary-icon" :class="predictionSummary.type">
        <i class="material-icons">{{ predictionSummary.icon }}</i>
      </div>
      <div class="summary-content">
        <h3>{{ predictionSummary.title }}</h3>
        <p>{{ predictionSummary.message }}</p>
      </div>
    </div>

    <div class="charts-section">
      <div class="chart-container">
        <h2>CPU 使用率预测</h2>
        <div class="chart-with-summary">
          <div class="chart">
            <canvas ref="cpuChart"></canvas>
          </div>
          <div class="metric-summary">
            <div class="metric-stat">
              <span class="stat-label">当前值:</span>
              <span class="stat-value">{{ formatValue(currentValues.cpu, '%') }}</span>
            </div>
            <div class="metric-stat">
              <span class="stat-label">预测峰值:</span>
              <span class="stat-value" :class="getPeakClass(peakValues.cpu, 80)">{{ formatValue(peakValues.cpu, '%') }}</span>
            </div>
            <div class="metric-stat" v-if="anomalies.cpu.length > 0">
              <span class="stat-label">可能异常:</span>
              <span class="stat-value warning">{{ anomalies.cpu.length }} 个时间点</span>
            </div>
          </div>
        </div>
      </div>

      <div class="chart-container">
        <h2>内存使用率预测</h2>
        <div class="chart-with-summary">
          <div class="chart">
            <canvas ref="memoryChart"></canvas>
          </div>
          <div class="metric-summary">
            <div class="metric-stat">
              <span class="stat-label">当前值:</span>
              <span class="stat-value">{{ formatValue(currentValues.memory, '%') }}</span>
            </div>
            <div class="metric-stat">
              <span class="stat-label">预测峰值:</span>
              <span class="stat-value" :class="getPeakClass(peakValues.memory, 75)">{{ formatValue(peakValues.memory, '%') }}</span>
            </div>
            <div class="metric-stat" v-if="anomalies.memory.length > 0">
              <span class="stat-label">可能异常:</span>
              <span class="stat-value warning">{{ anomalies.memory.length }} 个时间点</span>
            </div>
          </div>
        </div>
      </div>

      <div class="chart-container">
        <h2>磁盘使用率预测</h2>
        <div class="chart-with-summary">
          <div class="chart">
            <canvas ref="diskChart"></canvas>
          </div>
          <div class="metric-summary">
            <div class="metric-stat">
              <span class="stat-label">当前值:</span>
              <span class="stat-value">{{ formatValue(currentValues.disk, '%') }}</span>
            </div>
            <div class="metric-stat">
              <span class="stat-label">预测峰值:</span>
              <span class="stat-value" :class="getPeakClass(peakValues.disk, 85)">{{ formatValue(peakValues.disk, '%') }}</span>
            </div>
            <div class="metric-stat" v-if="anomalies.disk.length > 0">
              <span class="stat-label">可能异常:</span>
              <span class="stat-value warning">{{ anomalies.disk.length }} 个时间点</span>
            </div>
          </div>
        </div>
      </div>

      <div class="chart-container">
        <h2>网络流量预测</h2>
        <div class="chart-with-summary">
          <div class="chart">
            <canvas ref="networkChart"></canvas>
          </div>
          <div class="metric-summary">
            <div class="metric-stat">
              <span class="stat-label">当前值:</span>
              <span class="stat-value">{{ formatValue(currentValues.network, 'MB/s') }}</span>
            </div>
            <div class="metric-stat">
              <span class="stat-label">预测峰值:</span>
              <span class="stat-value" :class="getPeakClass(peakValues.network, 200)">{{ formatValue(peakValues.network, 'MB/s') }}</span>
            </div>
            <div class="metric-stat" v-if="anomalies.network.length > 0">
              <span class="stat-label">可能异常:</span>
              <span class="stat-value warning">{{ anomalies.network.length }} 个时间点</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="anomalies-section" v-if="hasAnomalies">
      <h2>潜在异常检测</h2>
      <div class="anomalies-list">
        <div class="anomaly-card" v-for="(anomaly, index) in allAnomalies" :key="index">
          <div class="anomaly-header">
            <div class="anomaly-metric">{{ getMetricName(anomaly.metric) }}</div>
            <div class="anomaly-impact" :class="anomaly.impact">{{ getImpactText(anomaly.impact) }}</div>
          </div>
          <div class="anomaly-time">
            <i class="material-icons">schedule</i>
            {{ formatDateTime(anomaly.timestamp) }}
          </div>
          <div class="anomaly-details">
            <div class="anomaly-value">
              <span>预测值: </span>
              <span class="value">{{ formatValue(anomaly.value, getMetricUnit(anomaly.metric)) }}</span>
            </div>
            <div class="anomaly-threshold">
              <span>阈值: </span>
              <span class="value">{{ formatValue(anomaly.threshold, getMetricUnit(anomaly.metric)) }}</span>
            </div>
            <div class="anomaly-probability">
              <span>可能性: </span>
              <span class="value">{{ Math.round(anomaly.probability * 100) }}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="solutions-section" v-if="solutions.length > 0">
      <h2>系统优化建议</h2>
      <div class="solutions-list">
        <div class="solution-card" v-for="(solution, index) in solutions" :key="index">
          <div class="solution-header">
            <h3>{{ getMetricName(solution.metric) }} 优化建议</h3>
          </div>
          <div class="solution-suggestions">
            <h4>建议操作:</h4>
            <ul>
              <li v-for="(suggestion, i) in solution.suggestions" :key="i">{{ suggestion }}</li>
            </ul>
          </div>
          <div class="solution-actions">
            <h4>可自动执行:</h4>
            <ul>
              <li v-for="(action, i) in solution.automatedActions" :key="i">{{ action }}</li>
            </ul>
          </div>
          <div class="solution-buttons">
            <button class="apply-button">应用建议</button>
            <button class="ignore-button">忽略</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.predictive-analytics-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #2c3e50;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 16px;
  align-items: center;
}

.time-range-selector, .prediction-horizon-selector {
  display: flex;
  align-items: center;
  gap: 8px;
}

.time-range-selector label, .prediction-horizon-selector label {
  font-size: 14px;
  color: #666;
}

.time-range-selector select, .prediction-horizon-selector select {
  padding: 6px 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: #fff;
  font-size: 14px;
}

.refresh-button {
  padding: 8px 16px;
  background-color: #1976d2;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
}

.refresh-button:hover {
  background-color: #1565c0;
}

.refresh-button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.prediction-summary {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  background-color: #f8f9fa;
  border-left: 4px solid #4caf50;
  border-radius: 4px;
  margin-bottom: 24px;
}

.prediction-summary.warning {
  border-left-color: #ff9800;
}

.prediction-summary.error {
  border-left-color: #f44336;
}

.summary-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: rgba(76, 175, 80, 0.1);
  color: #4caf50;
}

.summary-icon.warning {
  background-color: rgba(255, 152, 0, 0.1);
  color: #ff9800;
}

.summary-icon.error {
  background-color: rgba(244, 67, 54, 0.1);
  color: #f44336;
}

.summary-content h3 {
  font-size: 18px;
  margin: 0 0 4px;
  color: #333;
}

.summary-content p {
  font-size: 14px;
  margin: 0;
  color: #666;
}

.charts-section {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
  margin-bottom: 24px;
}

.chart-container {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  padding: 16px;
}

.chart-container h2 {
  font-size: 18px;
  margin: 0 0 16px;
  color: #333;
}

.chart-with-summary {
  display: flex;
  flex-direction: column;
}

.chart {
  flex-grow: 1;
  height: 250px;
  position: relative;
}

.metric-summary {
  display: flex;
  gap: 16px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #eee;
}

.metric-stat {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-label {
  font-size: 12px;
  color: #666;
}

.stat-value {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.stat-value.warning {
  color: #ff9800;
}

.stat-value.error {
  color: #f44336;
}

.anomalies-section, .solutions-section {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  padding: 20px;
  margin-bottom: 24px;
}

.anomalies-section h2, .solutions-section h2 {
  font-size: 20px;
  margin: 0 0 16px;
  color: #333;
}

.anomalies-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.anomaly-card {
  border: 1px solid #eee;
  border-radius: 6px;
  padding: 16px;
  background-color: #fafafa;
}

.anomaly-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.anomaly-metric {
  font-weight: 600;
  color: #333;
}

.anomaly-impact {
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 12px;
  color: white;
  background-color: #4caf50;
}

.anomaly-impact.medium {
  background-color: #ff9800;
}

.anomaly-impact.high {
  background-color: #f44336;
}

.anomaly-time {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #666;
  margin-bottom: 12px;
}

.anomaly-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.anomaly-value, .anomaly-threshold, .anomaly-probability {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  color: #666;
}

.value {
  font-weight: 600;
  color: #333;
}

.solutions-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

.solution-card {
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  padding: 16px;
  background-color: #fff;
}

.solution-header h3 {
  font-size: 16px;
  margin: 0 0 12px;
  color: #333;
}

.solution-suggestions h4, .solution-actions h4 {
  font-size: 14px;
  margin: 12px 0 8px;
  color: #555;
}

.solution-suggestions ul, .solution-actions ul {
  margin: 0;
  padding-left: 20px;
}

.solution-suggestions li, .solution-actions li {
  font-size: 14px;
  margin-bottom: 4px;
  color: #666;
}

.solution-buttons {
  display: flex;
  gap: 12px;
  margin-top: 16px;
}

.apply-button, .ignore-button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
}

.apply-button {
  background-color: #4caf50;
  color: white;
}

.ignore-button {
  background-color: #f5f5f5;
  color: #666;
  border: 1px solid #ddd;
}

.apply-button:hover {
  background-color: #388e3c;
}

.ignore-button:hover {
  background-color: #e0e0e0;
}

@media (max-width: 960px) {
  .charts-section {
    grid-template-columns: 1fr;
  }
  
  .header-section {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .header-actions {
    flex-direction: column;
    width: 100%;
  }
  
  .time-range-selector, .prediction-horizon-selector {
    width: 100%;
  }
  
  .refresh-button {
    width: 100%;
    justify-content: center;
  }
}
</style> 