import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import * as schema from './schema';
import { migrate } from 'drizzle-orm/node-postgres/migrator';

// 加载环境变量
dotenv.config();

// 数据库连接配置
const pgConfig = {
  user: process.env.POSTGRES_USER || 'louloulin',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'postgres',
  max: 20, // 连接池最大连接数
  idleTimeoutMillis: 30000, // 连接最大空闲时间
  connectionTimeoutMillis: 2000, // 连接超时时间
  ssl: false, // 禁用SSL
};

// 创建连接池
export const pgPool = new Pool(pgConfig);

// 连接事件监听
pgPool.on('connect', () => {
  console.log(`PostgreSQL 数据库连接成功 (Drizzle): ${pgConfig.host}:${pgConfig.port}/${pgConfig.database} (用户: ${pgConfig.user})`);
});

pgPool.on('error', (err) => {
  console.error('PostgreSQL 数据库连接错误 (Drizzle)', err);
});

// 创建drizzle ORM实例
export const db = drizzle(pgPool, { schema });

/**
 * 初始化Drizzle数据库
 * 可选择性地运行迁移
 */
export const initDrizzle = async (runMigrations = false) => {
  try {
    // 验证连接
    const result = await pgPool.query('SELECT NOW() as time, current_database() as db, current_user as user');
    console.log('Drizzle数据库连接验证成功:',
      `时间: ${result.rows[0].time}`,
      `数据库: ${result.rows[0].db}`,
      `用户: ${result.rows[0].user}`
    );
    
    // 如果需要，执行迁移
    if (runMigrations) {
      console.log('执行数据库迁移...');
      await migrate(db, { migrationsFolder: './drizzle' });
      console.log('数据库迁移完成');
    }
    
    console.log('Drizzle数据库初始化完成');
  } catch (err) {
    console.error('Drizzle数据库初始化失败', err);
    throw err;
  }
};

// 导出数据库实例
export default db; 