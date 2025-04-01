import { FastEmbed } from 'fastembed';
import { LibSQLVector } from '@mastra/vector-libsql';
import path from 'path';

// 初始化FastEmbed
const embedder = new FastEmbed({
  modelName: 'all-MiniLM-L6-v2', // 使用轻量级模型
  maxBatchSize: 256,
});

// 创建向量数据库连接
const vector = new LibSQLVector({
  connectionUrl: 'file:' + path.join(process.cwd(), 'data', 'vector.db'),
});

// 创建自定义嵌入提供商
export const customEmbeddingProvider = {
  async createEmbeddings(texts: string[]) {
    try {
      const embeddings = await embedder.embed(texts);
      return embeddings;
    } catch (error) {
      console.error('生成嵌入向量失败:', error);
      throw error;
    }
  }
};

// 导出向量数据库实例
export { vector }; 