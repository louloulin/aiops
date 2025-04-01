import { createClient } from 'redis';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

// 内存缓存实现
class MemoryCache {
  private cache: Map<string, { value: string, expiry?: number }> = new Map();
  private hashMaps: Map<string, Map<string, string>> = new Map();

  constructor() {
    console.log('使用内存缓存作为备选方案');
    // 启动过期数据清理任务
    setInterval(() => this.cleanExpired(), 30000);
  }

  // 清理过期数据
  private cleanExpired() {
    const now = Date.now();
    this.cache.forEach((item, key) => {
      if (item.expiry && item.expiry < now) {
        this.cache.delete(key);
      }
    });
  }

  // 设置缓存
  async set(key: string, value: string, options?: { EX?: number }) {
    const expiry = options?.EX ? Date.now() + options.EX * 1000 : undefined;
    this.cache.set(key, { value, expiry });
    return 'OK';
  }

  // 获取缓存
  async get(key: string) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    // 检查是否过期
    if (item.expiry && item.expiry < Date.now()) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }

  // 删除缓存
  async del(key: string) {
    if (key.includes('*')) {
      // 处理通配符删除
      const regex = new RegExp('^' + key.replace(/\*/g, '.*') + '$');
      let count = 0;
      
      // 删除匹配的键
      this.cache.forEach((_, cacheKey) => {
        if (regex.test(cacheKey)) {
          this.cache.delete(cacheKey);
          count++;
        }
      });
      
      return count;
    }
    
    // 普通键删除
    const deleted = this.cache.has(key);
    this.cache.delete(key);
    return deleted ? 1 : 0;
  }

  // 批量获取
  async mGet(keys: string[]) {
    return keys.map(key => {
      const item = this.cache.get(key);
      if (!item || (item.expiry && item.expiry < Date.now())) {
        if (item?.expiry && item.expiry < Date.now()) {
          this.cache.delete(key);
        }
        return null;
      }
      return item.value;
    });
  }

  // 检查键是否存在
  async exists(key: string) {
    const item = this.cache.get(key);
    if (!item) return 0;
    
    // 检查是否过期
    if (item.expiry && item.expiry < Date.now()) {
      this.cache.delete(key);
      return 0;
    }
    
    return 1;
  }

  // 扫描键
  async keys(pattern: string) {
    const result: string[] = [];
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    
    this.cache.forEach((_, key) => {
      if (regex.test(key)) {
        result.push(key);
      }
    });
    
    return result;
  }

  // 设置哈希表字段
  async hSet(key: string, field: string, value: string) {
    let hashMap = this.hashMaps.get(key);
    if (!hashMap) {
      hashMap = new Map();
      this.hashMaps.set(key, hashMap);
    }
    hashMap.set(field, value);
    return 1;
  }

  // 获取哈希表字段
  async hGet(key: string, field: string) {
    const hashMap = this.hashMaps.get(key);
    if (!hashMap) return null;
    return hashMap.get(field) || null;
  }

  // 获取哈希表所有字段
  async hGetAll(key: string) {
    const hashMap = this.hashMaps.get(key);
    if (!hashMap) return {};
    
    const result: Record<string, string> = {};
    hashMap.forEach((value, field) => {
      result[field] = value;
    });
    
    return result;
  }

  // 获取连接状态
  get isOpen() {
    return true; // 内存缓存总是可用
  }

  // 连接方法（为了兼容Redis API）
  async connect() {
    return this;
  }
}

// Redis 连接配置
const redisConfig = {
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  password: process.env.REDIS_PASSWORD || undefined,
  socket: {
    reconnectStrategy: (retries: number) => {
      // 重连策略：最大重试3次，每次间隔递增
      if (retries > 3) {
        console.warn('Redis 连接失败，切换到内存缓存');
        return false; // 停止重连
      }
      return Math.min(retries * 100, 1000); // 重试间隔，最大1秒
    }
  }
};

// 创建 Redis 客户端
const redisClient = createClient(redisConfig);

// 内存缓存实例
const memoryCache = new MemoryCache();

// 使用类型断言解决类型兼容性问题
type CacheClient = any; // 简化类型定义，使用any类型避免类型冲突

// 缓存客户端 - 默认使用内存缓存，避免测试和初始化问题
// 成功连接Redis后将切换到Redis
let cacheClient: CacheClient = memoryCache;

// 连接事件监听
redisClient.on('connect', () => {
  console.log(`Redis 连接中... ${redisConfig.url}`);
});

redisClient.on('ready', () => {
  console.log('Redis 连接成功，准备就绪');
  cacheClient = redisClient as CacheClient;
});

redisClient.on('error', (err) => {
  console.error('Redis 连接错误:', err.message);
  if (cacheClient !== memoryCache) {
    console.log('切换到内存缓存');
    cacheClient = memoryCache;
  }
});

redisClient.on('reconnecting', () => {
  console.log('Redis 正在重新连接...');
});

/**
 * 初始化缓存连接
 * 注意：此函数会被自动调用一次，通常不需要手动调用
 */
export const initRedis = async () => {
  try {
    // 默认使用内存缓存
    cacheClient = memoryCache;
    
    // 尝试连接Redis
    await Promise.race([
      redisClient.connect()
        .then(() => {
          if (redisClient.isOpen) {
            console.log('Redis连接成功，将使用Redis缓存');
            cacheClient = redisClient as CacheClient;
          }
        })
        .catch(err => {
          console.warn('Redis 连接失败:', err.message);
        }),
      new Promise<void>((resolve) => 
        setTimeout(() => {
          console.log('Redis 连接超时，使用内存缓存');
          resolve();
        }, 2000)
      )
    ]);
  } catch (error) {
    console.warn('Redis 初始化错误，使用内存缓存:', error instanceof Error ? error.message : error);
  }
};

// 测试环境直接使用内存缓存
if (process.env.NODE_ENV === 'test') {
  console.log('测试环境使用内存缓存');
  cacheClient = memoryCache;
}

/**
 * 获取缓存数据
 * @param key 缓存键
 * @returns 缓存值
 */
export const getCache = async (key: string) => {
  try {
    return await cacheClient.get(key);
  } catch (error) {
    console.error('缓存获取错误:', error);
    return null;
  }
};

/**
 * 设置缓存数据
 * @param key 缓存键
 * @param value 缓存值
 * @param expiry 过期时间(秒)
 */
export const setCache = async (key: string, value: string, expiry?: number) => {
  try {
    if (expiry) {
      await cacheClient.set(key, value, { EX: expiry });
    } else {
      await cacheClient.set(key, value);
    }
  } catch (error) {
    console.error('缓存设置错误:', error);
  }
};

/**
 * 删除缓存数据
 * @param key 缓存键
 */
export const deleteCache = async (key: string) => {
  try {
    await cacheClient.del(key);
  } catch (error) {
    console.error('缓存删除错误:', error);
  }
};

/**
 * 批量获取缓存数据
 * @param keys 缓存键数组
 * @returns 缓存值数组
 */
export const mgetCache = async (keys: string[]) => {
  try {
    return await cacheClient.mGet(keys);
  } catch (error) {
    console.error('批量获取缓存错误:', error);
    return [];
  }
};

/**
 * 检查键是否存在
 * @param key 缓存键
 * @returns 是否存在
 */
export const existsCache = async (key: string) => {
  try {
    return await cacheClient.exists(key);
  } catch (error) {
    console.error('检查键存在错误:', error);
    return 0;
  }
};

/**
 * 获取所有键的匹配模式
 * @param pattern 匹配模式
 * @returns 匹配的键数组
 */
export const scanKeys = async (pattern: string) => {
  try {
    return await cacheClient.keys(pattern);
  } catch (error) {
    console.error('扫描键错误:', error);
    return [];
  }
};

/**
 * 设置哈希表字段
 * @param key 哈希表键
 * @param field 字段名
 * @param value 字段值
 */
export const setHashField = async (key: string, field: string, value: string) => {
  try {
    await cacheClient.hSet(key, field, value);
  } catch (error) {
    console.error('设置哈希字段错误:', error);
  }
};

/**
 * 获取哈希表字段
 * @param key 哈希表键
 * @param field 字段名
 * @returns 字段值
 */
export const getHashField = async (key: string, field: string) => {
  try {
    return await cacheClient.hGet(key, field);
  } catch (error) {
    console.error('获取哈希字段错误:', error);
    return null;
  }
};

/**
 * 获取哈希表所有字段
 * @param key 哈希表键
 * @returns 字段和值的对象
 */
export const getAllHashFields = async (key: string) => {
  try {
    return await cacheClient.hGetAll(key);
  } catch (error) {
    console.error('获取所有哈希字段错误:', error);
    return {};
  }
};

// 导出一个函数用于判断当前使用的缓存类型
export const isCacheMemory = () => {
  return cacheClient instanceof MemoryCache;
};

// 导出缓存客户端
export default cacheClient; 