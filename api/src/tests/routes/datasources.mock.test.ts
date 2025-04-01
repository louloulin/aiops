import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MockDatabase, createMockDataSource } from '../datasources.mock';

describe('数据源模拟测试', () => {
  let mockDb: MockDatabase;

  beforeEach(() => {
    mockDb = new MockDatabase();
  });

  afterEach(async () => {
    await mockDb.clearAll();
  });

  describe('数据源CRUD操作', () => {
    it('应该能够添加数据源', async () => {
      const dataSource = {
        name: 'Test Prometheus',
        type: 'prometheus',
        url: 'http://prometheus:9090'
      };

      const result = await mockDb.addDataSource(dataSource);
      
      expect(result.id).toBeDefined();
      expect(result.name).toBe(dataSource.name);
      expect(result.type).toBe(dataSource.type);
      expect(result.url).toBe(dataSource.url);
      expect(result.status).toBe('pending');
    });

    it('应该能够获取所有数据源', async () => {
      // 添加两个测试数据源
      await mockDb.addDataSource({ name: 'Test Prometheus 1' });
      await mockDb.addDataSource({ name: 'Test Prometheus 2' });

      const dataSources = await mockDb.getAllDataSources();
      
      expect(dataSources.length).toBe(2);
      expect(dataSources.some(ds => ds.name === 'Test Prometheus 1')).toBe(true);
      expect(dataSources.some(ds => ds.name === 'Test Prometheus 2')).toBe(true);
    });

    it('应该能够通过ID获取数据源', async () => {
      const dataSource = await mockDb.addDataSource({ name: 'Test Prometheus' });

      const result = await mockDb.getDataSourceById(dataSource.id);
      
      expect(result).toBeDefined();
      expect(result?.id).toBe(dataSource.id);
      expect(result?.name).toBe(dataSource.name);
    });

    it('应该能够更新数据源', async () => {
      const dataSource = await mockDb.addDataSource({ name: 'Test Prometheus' });

      const updateData = {
        name: 'Updated Prometheus',
        url: 'http://prometheus-new:9090'
      };

      const result = await mockDb.updateDataSource(dataSource.id, updateData);
      
      expect(result).toBeDefined();
      expect(result?.id).toBe(dataSource.id);
      expect(result?.name).toBe(updateData.name);
      expect(result?.url).toBe(updateData.url);
      expect(result?.updatedAt).toBeDefined();
    });

    it('应该能够删除数据源', async () => {
      const dataSource = await mockDb.addDataSource({ name: 'Test Prometheus' });

      const deleteResult = await mockDb.deleteDataSource(dataSource.id);
      expect(deleteResult).toBe(true);

      const dataSources = await mockDb.getAllDataSources();
      expect(dataSources.length).toBe(0);

      const getResult = await mockDb.getDataSourceById(dataSource.id);
      expect(getResult).toBeUndefined();
    });

    it('删除不存在的数据源应返回false', async () => {
      const result = await mockDb.deleteDataSource('non-existent-id');
      expect(result).toBe(false);
    });

    it('更新不存在的数据源应返回null', async () => {
      const result = await mockDb.updateDataSource('non-existent-id', { name: 'New Name' });
      expect(result).toBeNull();
    });
  });

  describe('模拟数据生成', () => {
    it('应该创建带有默认值的数据源', () => {
      const dataSource = createMockDataSource();
      
      expect(dataSource.id).toBeDefined();
      expect(dataSource.name).toContain('Test Datasource');
      expect(dataSource.type).toBe('prometheus');
      expect(dataSource.url).toBe('http://prometheus:9090');
      expect(dataSource.status).toBe('pending');
      expect(dataSource.createdAt).toBeDefined();
    });

    it('应该创建带有自定义值的数据源', () => {
      const customData = {
        name: 'Custom Datasource',
        type: 'grafana',
        url: 'http://grafana:3000',
        status: 'connected'
      };

      const dataSource = createMockDataSource(customData);
      
      expect(dataSource.id).toBeDefined();
      expect(dataSource.name).toBe(customData.name);
      expect(dataSource.type).toBe(customData.type);
      expect(dataSource.url).toBe(customData.url);
      expect(dataSource.status).toBe(customData.status);
    });
  });
}); 