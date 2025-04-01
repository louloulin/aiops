import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { db } from '../../db';
import { eq } from 'drizzle-orm';
import { datasources } from '../../db/schema/datasources';
import '../setup'; // 引入测试设置

// 从index.ts导入app实例或创建一个应用实例
import { Hono } from 'hono';
import datasourcesRoutes from '../../routes/datasources';

// 创建一个测试专用的应用实例
const app = new Hono();
app.route('/api/datasources', datasourcesRoutes);

// 测试数据
const testDataSource = {
  name: 'Test Prometheus',
  type: 'prometheus', // 使用字符串而不是枚举
  url: 'http://prometheus:9090',
  username: 'test',
  password: 'test123',
  apiKey: ''
};

// 清理测试数据
async function cleanupTestData() {
  await db.delete(datasources).where(eq(datasources.name, testDataSource.name));
}

describe('DataSources API', () => {
  beforeAll(async () => {
    await cleanupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  describe('POST /api/datasources', () => {
    it('should create a new data source', async () => {
      const response = await request(app.fetch)
        .post('/api/datasources')
        .send(testDataSource)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(testDataSource.name);
      expect(response.body.type).toBe(testDataSource.type);
      expect(response.body.url).toBe(testDataSource.url);
      expect(response.body.status).toBe('pending');
    });

    it('should return 400 for invalid input', async () => {
      const invalidDataSource = { ...testDataSource, name: '' };
      
      const response = await request(app.fetch)
        .post('/api/datasources')
        .send(invalidDataSource)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/datasources', () => {
    let createdDataSourceId: string;

    beforeEach(async () => {
      // 创建测试数据
      const createResponse = await request(app.fetch)
        .post('/api/datasources')
        .send(testDataSource);
      
      createdDataSourceId = createResponse.body.id;
    });

    afterEach(async () => {
      await cleanupTestData();
    });

    it('should return all data sources', async () => {
      const response = await request(app.fetch)
        .get('/api/datasources')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body.some((ds: any) => ds.name === testDataSource.name)).toBe(true);
    });

    it('should filter data sources by type', async () => {
      const response = await request(app.fetch)
        .get(`/api/datasources?type=prometheus`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.every((ds: any) => ds.type === 'prometheus')).toBe(true);
    });

    it('should filter data sources by status', async () => {
      const response = await request(app.fetch)
        .get(`/api/datasources?status=pending`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.every((ds: any) => ds.status === 'pending')).toBe(true);
    });

    it('should get a specific data source by ID', async () => {
      const response = await request(app.fetch)
        .get(`/api/datasources/${createdDataSourceId}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', createdDataSourceId);
      expect(response.body.name).toBe(testDataSource.name);
    });

    it('should return 404 for non-existent data source', async () => {
      await request(app.fetch)
        .get('/api/datasources/non-existent-id')
        .expect(404);
    });
  });

  describe('PUT /api/datasources/:id', () => {
    let createdDataSourceId: string;

    beforeEach(async () => {
      // 创建测试数据
      const createResponse = await request(app.fetch)
        .post('/api/datasources')
        .send(testDataSource);
      
      createdDataSourceId = createResponse.body.id;
    });

    afterEach(async () => {
      await cleanupTestData();
    });

    it('should update an existing data source', async () => {
      const updatedData = {
        name: 'Updated Prometheus',
        url: 'http://prometheus-new:9090'
      };

      const response = await request(app.fetch)
        .put(`/api/datasources/${createdDataSourceId}`)
        .send(updatedData)
        .expect(200);

      expect(response.body).toHaveProperty('id', createdDataSourceId);
      expect(response.body.name).toBe(updatedData.name);
      expect(response.body.url).toBe(updatedData.url);
    });

    it('should return 404 for non-existent data source', async () => {
      await request(app.fetch)
        .put('/api/datasources/non-existent-id')
        .send({ name: 'New Name' })
        .expect(404);
    });
  });

  describe('DELETE /api/datasources/:id', () => {
    let createdDataSourceId: string;

    beforeEach(async () => {
      // 创建测试数据
      const createResponse = await request(app.fetch)
        .post('/api/datasources')
        .send(testDataSource);
      
      createdDataSourceId = createResponse.body.id;
    });

    afterEach(async () => {
      await cleanupTestData();
    });

    it('should delete a data source', async () => {
      await request(app.fetch)
        .delete(`/api/datasources/${createdDataSourceId}`)
        .expect(200);

      // 验证数据已被删除
      await request(app.fetch)
        .get(`/api/datasources/${createdDataSourceId}`)
        .expect(404);
    });

    it('should return 404 for non-existent data source', async () => {
      await request(app.fetch)
        .delete('/api/datasources/non-existent-id')
        .expect(404);
    });
  });

  describe('POST /api/datasources/:id/test', () => {
    let createdDataSourceId: string;

    beforeEach(async () => {
      // 创建测试数据
      const createResponse = await request(app.fetch)
        .post('/api/datasources')
        .send(testDataSource);
      
      createdDataSourceId = createResponse.body.id;
    });

    afterEach(async () => {
      await cleanupTestData();
    });

    it('should test a data source connection', async () => {
      const response = await request(app.fetch)
        .post(`/api/datasources/${createdDataSourceId}/test`)
        .expect(200);

      expect(response.body).toHaveProperty('success');
      // 注意: 实际测试可能会失败，因为我们没有真正的 Prometheus 服务器
      // 这里我们只是检查 API 是否返回正确的结构
    });

    it('should return 404 for non-existent data source', async () => {
      await request(app.fetch)
        .post('/api/datasources/non-existent-id/test')
        .expect(404);
    });
  });
}); 