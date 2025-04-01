// 创建模拟数据和测试工具
import { v4 as uuidv4 } from 'uuid';

// 模拟数据源
export interface MockDataSource {
  id: string;
  name: string;
  type: string;
  url: string;
  description?: string;
  status: string;
  credentials?: string;
  lastSync?: string | null;
  metrics: number;
  createdAt: string;
  updatedAt?: string | null;
}

// 创建模拟数据
export function createMockDataSource(override: Partial<MockDataSource> = {}): MockDataSource {
  return {
    id: uuidv4(),
    name: `Test Datasource ${Math.floor(Math.random() * 1000)}`,
    type: 'prometheus',
    url: 'http://prometheus:9090',
    description: 'Test description',
    status: 'pending',
    credentials: JSON.stringify({ apiKey: 'test-key' }),
    lastSync: null,
    metrics: 0,
    createdAt: new Date().toISOString(),
    updatedAt: null,
    ...override,
  };
}

// 模拟数据库
export class MockDatabase {
  private dataSources: MockDataSource[] = [];

  // 添加数据源
  async addDataSource(dataSource: Partial<MockDataSource>): Promise<MockDataSource> {
    const newDataSource = createMockDataSource(dataSource);
    this.dataSources.push(newDataSource);
    return newDataSource;
  }

  // 获取所有数据源
  async getAllDataSources(): Promise<MockDataSource[]> {
    return this.dataSources;
  }

  // 获取指定ID的数据源
  async getDataSourceById(id: string): Promise<MockDataSource | undefined> {
    return this.dataSources.find(ds => ds.id === id);
  }

  // 更新数据源
  async updateDataSource(id: string, data: Partial<MockDataSource>): Promise<MockDataSource | null> {
    const index = this.dataSources.findIndex(ds => ds.id === id);
    if (index === -1) return null;
    
    this.dataSources[index] = {
      ...this.dataSources[index],
      ...data,
      updatedAt: new Date().toISOString()
    };
    
    return this.dataSources[index];
  }

  // 删除数据源
  async deleteDataSource(id: string): Promise<boolean> {
    const index = this.dataSources.findIndex(ds => ds.id === id);
    if (index === -1) return false;
    
    this.dataSources.splice(index, 1);
    return true;
  }

  // 清除所有数据
  async clearAll(): Promise<void> {
    this.dataSources = [];
  }
} 