import { initDatabase } from './postgres';
import { initRedis } from './redis';
import { initDrizzle } from './drizzle';
import { DbService } from './db-service';

// 导出数据库服务实例
export const dbService = new DbService();

/**
 * 初始化所有数据存储服务
 */
export const initializeDataServices = async () => {
  try {
    // 初始化 PostgreSQL 数据库 (旧版)
    await initDatabase();
    
    // 初始化 Drizzle ORM (新版)
    await initDrizzle();
    
    // 初始化 Redis 缓存
    await initRedis();
    
    console.log('所有数据存储服务初始化完成');
  } catch (error) {
    console.error('数据存储服务初始化失败:', error);
    throw error;
  }
};

// 导出所有数据库模块
export * from './postgres';
export * from './redis';
export * from './drizzle';
export * from './schema';
export * from './db-service'; 