/**
 * API服务
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:9700/api';

/**
 * 业务指标相关API
 */
export const businessMetricsApi = {
  /**
   * 获取所有业务指标
   */
  async getMetrics() {
    try {
      const response = await fetch(`${API_BASE_URL}/business-metrics`);
      if (!response.ok) {
        throw new Error('Failed to fetch metrics');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching metrics:', error);
      return { success: false, message: 'Failed to fetch metrics', metrics: [] };
    }
  },

  /**
   * 获取单个业务指标详情
   * @param id 指标ID
   */
  async getMetric(id: number) {
    try {
      const response = await fetch(`${API_BASE_URL}/business-metrics/${id}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch metric with id ${id}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error fetching metric ${id}:`, error);
      return { success: false, message: `Failed to fetch metric ${id}` };
    }
  },

  /**
   * 创建业务指标
   * @param metricData 指标数据
   */
  async createMetric(metricData: any) {
    try {
      const response = await fetch(`${API_BASE_URL}/business-metrics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(metricData)
      });
      if (!response.ok) {
        throw new Error('Failed to create metric');
      }
      return await response.json();
    } catch (error) {
      console.error('Error creating metric:', error);
      return { success: false, message: 'Failed to create metric' };
    }
  },

  /**
   * 更新业务指标
   * @param id 指标ID
   * @param metricData 指标数据
   */
  async updateMetric(id: number, metricData: any) {
    try {
      const response = await fetch(`${API_BASE_URL}/business-metrics/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(metricData)
      });
      if (!response.ok) {
        throw new Error(`Failed to update metric ${id}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error updating metric ${id}:`, error);
      return { success: false, message: `Failed to update metric ${id}` };
    }
  },

  /**
   * 删除业务指标
   * @param id 指标ID
   */
  async deleteMetric(id: number) {
    try {
      const response = await fetch(`${API_BASE_URL}/business-metrics/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) {
        throw new Error(`Failed to delete metric ${id}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error deleting metric ${id}:`, error);
      return { success: false, message: `Failed to delete metric ${id}` };
    }
  },

  /**
   * 获取业务指标数据
   * @param id 指标ID
   * @param timeRange 时间范围：1h, 6h, 24h, 7d, 30d
   */
  async getMetricData(id: number, timeRange: string = '24h') {
    try {
      const response = await fetch(`${API_BASE_URL}/business-metrics/${id}/data?timeRange=${timeRange}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch data for metric ${id}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error fetching data for metric ${id}:`, error);
      return { success: false, message: `Failed to fetch data for metric ${id}`, data: [] };
    }
  }
};

/**
 * 日志相关API
 */
export const logsApi = {
  /**
   * 获取日志
   * @param params 查询参数
   */
  async getLogs(params: any = {}) {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
      
      const response = await fetch(`${API_BASE_URL}/logs?${queryParams.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch logs');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching logs:', error);
      return { success: false, message: 'Failed to fetch logs', logs: [] };
    }
  },
  
  /**
   * 获取日志统计
   * @param params 查询参数
   */
  async getLogsAnalytics(params: any = {}) {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
      
      const response = await fetch(`${API_BASE_URL}/logs/analytics?${queryParams.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch logs analytics');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching logs analytics:', error);
      return { success: false, message: 'Failed to fetch logs analytics', data: {} };
    }
  }
};

/**
 * 指标相关API
 */
export const metricsApi = {
  /**
   * 获取系统指标
   * @param params 查询参数
   */
  async getSystemMetrics(params: any = {}) {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
      
      const response = await fetch(`${API_BASE_URL}/metrics/system?${queryParams.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch system metrics');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching system metrics:', error);
      return { success: false, message: 'Failed to fetch system metrics', metrics: [] };
    }
  },
  
  /**
   * 获取异常检测结果
   * @param params 查询参数
   */
  async getAnomalies(params: any = {}) {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
      
      const response = await fetch(`${API_BASE_URL}/metrics/anomalies?${queryParams.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch anomalies');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching anomalies:', error);
      return { success: false, message: 'Failed to fetch anomalies', anomalies: [] };
    }
  }
};

/**
 * 部署相关API
 */
export const deployApi = {
  /**
   * 获取部署历史
   */
  async getDeployments(params: any = {}) {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
      
      const response = await fetch(`${API_BASE_URL}/deployments?${queryParams.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch deployments');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching deployments:', error);
      return { success: false, message: 'Failed to fetch deployments', deployments: [] };
    }
  },

  /**
   * 触发部署
   * @param deployData 部署数据
   */
  async createDeployment(deploymentData: any) {
    try {
      const response = await fetch(`${API_BASE_URL}/deployments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(deploymentData)
      });
      if (!response.ok) {
        throw new Error('Failed to create deployment');
      }
      return await response.json();
    } catch (error) {
      console.error('Error creating deployment:', error);
      return { success: false, message: 'Failed to create deployment' };
    }
  },
};

/**
 * 自动修复相关API
 */
export const autohealApi = {
  /**
   * 获取修复记录
   */
  getRepairLogs: async () => {
    const response = await fetch(`${API_BASE_URL}/api/autoheal/logs`, {
      headers: { 'Content-Type': 'application/json' }
    });
    if (!response.ok) {
      throw new Error(`获取修复记录失败: ${response.statusText}`);
    }
    return response.json();
  },
};

/**
 * 知识库相关API
 */
export const knowledgeApi = {
  /**
   * 查询知识库
   * @param query 查询内容
   */
  queryKnowledge: async (query: string) => {
    const response = await fetch(`${API_BASE_URL}/api/knowledge/query?q=${encodeURIComponent(query)}`, {
      headers: { 'Content-Type': 'application/json' }
    });
    if (!response.ok) {
      throw new Error(`查询知识库失败: ${response.statusText}`);
    }
    return response.json();
  },

  /**
   * 添加知识条目
   * @param knowledgeData 知识条目数据
   */
  addKnowledgeItem: async (knowledgeData: any) => {
    const response = await fetch(`${API_BASE_URL}/api/knowledge/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(knowledgeData)
    });
    if (!response.ok) {
      throw new Error(`添加知识条目失败: ${response.statusText}`);
    }
    return response.json();
  },
};

export default {
  businessMetricsApi,
  logsApi,
  metricsApi,
  deployApi,
  autohealApi,
  knowledgeApi
}; 