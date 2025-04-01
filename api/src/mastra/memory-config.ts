import { Memory } from '@mastra/memory';

// 创建一个基础的记忆实例，禁用所有语义搜索功能
export function createBaseMemory() {
  return new Memory({
    options: {
      lastMessages: 15,
      semanticRecall: { enabled: false },
      workingMemory: { enabled: true },
    }
  });
}

// 导出一个预先创建的记忆实例
export const baseMemory = createBaseMemory(); 