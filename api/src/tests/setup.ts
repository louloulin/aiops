import { beforeAll, afterAll } from 'vitest';
import { db } from '../db';

// 在测试开始前初始化测试环境
beforeAll(async () => {
  // 确保数据库表存在
  try {
    // 创建数据源表
    await db.execute(`
      CREATE TABLE IF NOT EXISTS datasources (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        url TEXT NOT NULL,
        description TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        credentials TEXT,
        "lastSync" TEXT,
        metrics INTEGER DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT
      )
    `);
    console.log('测试环境初始化完成');
  } catch (error) {
    console.error('测试环境初始化失败:', error);
    throw error;
  }
});

// 在所有测试完成后清理环境
afterAll(async () => {
  try {
    // 删除测试数据
    await db.execute('DELETE FROM datasources WHERE name LIKE \'Test%\'');
    console.log('测试环境清理完成');
  } catch (error) {
    console.error('测试环境清理失败:', error);
  }
}); 