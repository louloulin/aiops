import { Pool } from 'pg';
import dotenv from 'dotenv';

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
const pool = new Pool(pgConfig);

// 连接事件监听
pool.on('connect', () => {
  console.log(`PostgreSQL 数据库连接成功: ${pgConfig.host}:${pgConfig.port}/${pgConfig.database} (用户: ${pgConfig.user})`);
});

pool.on('error', (err) => {
  console.error('PostgreSQL 数据库连接错误', err);
});

/**
 * 执行SQL查询
 * @param text SQL语句
 * @param params 查询参数
 * @returns 查询结果
 */
export const query = async (text: string, params?: any[]) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    
    // 记录长时间查询，用于性能优化
    if (duration > 500) {
      console.warn(`SQL查询耗时过长 (${duration}ms): ${text}`);
    }
    
    return res;
  } catch (err) {
    console.error('SQL查询出错:', text, params, err);
    throw err;
  }
};

/**
 * 获取数据库连接
 * @returns 数据库客户端
 */
export const getClient = async () => {
  const client = await pool.connect();
  const originalRelease = client.release;
  
  // 重写release方法以记录连接使用时间
  client.release = () => {
    client.query('SELECT NOW()').then(() => {
      originalRelease.apply(client);
    }).catch((err) => {
      console.error('获取数据库时间错误', err);
      originalRelease.apply(client);
    });
  };
  
  return client;
};

/**
 * 初始化数据库表
 */
export const initDatabase = async () => {
  try {
    // 创建系统指标表
    await query(`
      CREATE TABLE IF NOT EXISTS system_metrics (
        id SERIAL PRIMARY KEY,
        cpu_usage FLOAT NOT NULL,
        cpu_temperature FLOAT NOT NULL,
        memory_total BIGINT NOT NULL,
        memory_used BIGINT NOT NULL,
        memory_free BIGINT NOT NULL,
        disk_total BIGINT NOT NULL,
        disk_used BIGINT NOT NULL,
        disk_free BIGINT NOT NULL,
        network_bytes_in BIGINT NOT NULL,
        network_bytes_out BIGINT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // 创建异常检测表
    await query(`
      CREATE TABLE IF NOT EXISTS anomalies (
        id SERIAL PRIMARY KEY,
        component VARCHAR(50) NOT NULL,
        severity VARCHAR(20) NOT NULL,
        message TEXT NOT NULL,
        detected_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        resolved_at TIMESTAMP WITH TIME ZONE,
        status VARCHAR(20) DEFAULT 'open'
      )
    `);
    
    // 创建系统事件表
    await query(`
      CREATE TABLE IF NOT EXISTS system_events (
        id SERIAL PRIMARY KEY,
        event_type VARCHAR(50) NOT NULL,
        source VARCHAR(50) NOT NULL,
        description TEXT NOT NULL,
        severity VARCHAR(20) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('数据库表初始化完成');
  } catch (err) {
    console.error('数据库表初始化失败', err);
  }
};

// 导出数据库连接池
export default pool; 