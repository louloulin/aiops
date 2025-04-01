import { setCache, getCache, deleteCache, setHashField, getHashField, existsCache } from '../db/redis';
import { describe, it, expect, beforeAll, afterEach } from 'vitest';

describe('内存缓存功能测试', () => {
  beforeAll(async () => {
    // 清空所有测试数据
    await deleteCache('test:*');
  });

  afterEach(async () => {
    // 每个测试后清理
    await deleteCache('test:key');
    await deleteCache('test:hash');
  });

  it('应该能设置和获取字符串值', async () => {
    // 设置缓存
    await setCache('test:key', 'test-value');
    
    // 获取缓存
    const value = await getCache('test:key');
    
    // 验证结果
    expect(value).toBe('test-value');
  });

  it('应该正确处理不存在的键', async () => {
    // 获取不存在的键
    const value = await getCache('test:non-existent');
    
    // 验证结果
    expect(value).toBeNull();
  });

  it('应该能设置带过期时间的缓存', async () => {
    // 设置短过期时间的缓存
    await setCache('test:key', 'expiring-value', 1); // 1秒过期
    
    // 立即获取
    const valueBeforeExpiry = await getCache('test:key');
    expect(valueBeforeExpiry).toBe('expiring-value');
    
    // 等待过期
    await new Promise(resolve => setTimeout(resolve, 1100));
    
    // 再次获取，应该过期了
    const valueAfterExpiry = await getCache('test:key');
    expect(valueAfterExpiry).toBeNull();
  });

  it('应该能检查键是否存在', async () => {
    // 设置缓存
    await setCache('test:key', 'exists-value');
    
    // 检查存在
    const exists = await existsCache('test:key');
    expect(exists).toBe(1);
    
    // 检查不存在的键
    const notExists = await existsCache('test:non-existent');
    expect(notExists).toBe(0);
  });

  it('应该能删除键', async () => {
    // 设置缓存
    await setCache('test:key', 'delete-me');
    
    // 确认存在
    const existsBefore = await existsCache('test:key');
    expect(existsBefore).toBe(1);
    
    // 删除
    await deleteCache('test:key');
    
    // 确认已删除
    const existsAfter = await existsCache('test:key');
    expect(existsAfter).toBe(0);
  });

  it('应该能设置和获取哈希表字段', async () => {
    // 设置哈希字段
    await setHashField('test:hash', 'field1', 'value1');
    await setHashField('test:hash', 'field2', 'value2');
    
    // 获取哈希字段
    const value1 = await getHashField('test:hash', 'field1');
    const value2 = await getHashField('test:hash', 'field2');
    
    // 验证结果
    expect(value1).toBe('value1');
    expect(value2).toBe('value2');
  });
}); 