import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Client } from 'pg';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

/**
 * 执行数据库迁移
 * 此脚本用于应用./drizzle目录下的迁移文件到数据库
 */
async function main() {
  console.log('🔄 开始执行数据库迁移...');

  // 数据库连接URI
  const pgUri = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/aiops?sslmode=disable';
  console.log(`📡 连接到数据库: ${pgUri}`);

  // 创建客户端
  const client = new Client({
    connectionString: pgUri,
  });

  try {
    // 连接到数据库
    console.log('🔌 连接到PostgreSQL...');
    await client.connect();
    console.log('✅ 连接成功!');

    // 测试连接
    console.log('🔍 测试数据库连接...');
    const testResult = await client.query('SELECT current_database() as db, current_user as user');
    console.log(`📊 数据库: ${testResult.rows[0].db}, 用户: ${testResult.rows[0].user}`);

    // 初始化Drizzle
    const db = drizzle(client);

    // 执行迁移
    console.log('📥 正在应用迁移...');
    await migrate(db, { migrationsFolder: './drizzle' });
    
    console.log('✅ 迁移成功完成!');
  } catch (error) {
    console.error('❌ 迁移过程中出错:', error);
    
    // 更详细的错误信息
    if (error instanceof Error) {
      console.error('错误详情:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
        ...(error as any),
      });
    }
    
    process.exit(1);
  } finally {
    try {
      // 关闭客户端连接
      await client.end();
      console.log('🔌 数据库连接已关闭');
    } catch (err) {
      console.error('关闭连接时出错:', err);
    }
  }
}

// 如果直接运行此脚本，执行迁移
if (require.main === module) {
  main()
    .then(() => {
      console.log('⭐ 数据库迁移脚本执行完毕');
      process.exit(0);
    })
    .catch((err) => {
      console.error('💥 执行迁移脚本时发生错误:', err);
      process.exit(1);
    });
}

// 导出函数，方便在应用启动时调用
export default main; 