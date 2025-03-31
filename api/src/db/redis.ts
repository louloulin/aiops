import { createClient } from 'redis';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

// Redis 连接配置
const redisConfig = {
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  password: process.env.REDIS_PASSWORD || undefined,
  socket: {
    reconnectStrategy: (retries: number) => {
      // 重连策略：最大重试3次，每次间隔递增
      if (retries > 3) {
        console.warn('Redis 连接失败，但应用将继续运行');
        return false; // 停止重连
      }
      return Math.min(retries * 100, 1000); // 重试间隔，最大1秒
    }
  }
};

// 创建 Redis 客户端
const redisClient = createClient(redisConfig);

// 连接事件监听
redisClient.on('connect', () => {
  console.log(`Redis 连接中... ${redisConfig.url}`);
});

redisClient.on('ready', () => {
  console.log('Redis 连接成功，准备就绪');
});

redisClient.on('error', (err) => {
  console.error('Redis 连接错误:', err.message);
});

redisClient.on('reconnecting', () => {
  console.log('Redis 正在重新连接...');
});

/**
 * 初始化 Redis 连接
 */
export const initRedis = async () => {
  try {
    if (!redisClient.isOpen) {
      await Promise.race([
        redisClient.connect(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Redis connection timeout')), 2000)
        )
      ]);
    }
  } catch (error) {
    console.warn('Redis 初始化错误，但应用将继续运行:', error instanceof Error ? error.message : error);
  }
};

/**
 * 获取缓存数据
 * @param key 缓存键
 * @returns 缓存值
 */
export const getCache = async (key: string) => {
  try {
    if (!redisClient.isOpen) {
      console.warn('Redis 未连接，无法获取缓存');
      return null;
    }
    return await redisClient.get(key);
  } catch (error) {
    console.error('Redis 获取缓存错误:', error);
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
    if (!redisClient.isOpen) {
      console.warn('Redis 未连接，无法设置缓存');
      return;
    }
    if (expiry) {
      await redisClient.set(key, value, { EX: expiry });
    } else {
      await redisClient.set(key, value);
    }
  } catch (error) {
    console.error('Redis 设置缓存错误:', error);
  }
};

/**
 * 删除缓存数据
 * @param key 缓存键
 */
export const deleteCache = async (key: string) => {
  try {
    await redisClient.del(key);
  } catch (error) {
    console.error('Redis 删除缓存错误:', error);
  }
};

/**
 * 批量获取缓存数据
 * @param keys 缓存键数组
 * @returns 缓存值数组
 */
export const mgetCache = async (keys: string[]) => {
  try {
    return await redisClient.mGet(keys);
  } catch (error) {
    console.error('Redis 批量获取缓存错误:', error);
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
    return await redisClient.exists(key);
  } catch (error) {
    console.error('Redis 检查键存在错误:', error);
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
    return await redisClient.keys(pattern);
  } catch (error) {
    console.error('Redis 扫描键错误:', error);
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
    await redisClient.hSet(key, field, value);
  } catch (error) {
    console.error('Redis 设置哈希字段错误:', error);
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
    return await redisClient.hGet(key, field);
  } catch (error) {
    console.error('Redis 获取哈希字段错误:', error);
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
    return await redisClient.hGetAll(key);
  } catch (error) {
    console.error('Redis 获取所有哈希字段错误:', error);
    return {};
  }
};

// 导出 Redis 客户端
export default redisClient; 