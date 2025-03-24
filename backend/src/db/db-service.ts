import { eq, desc, sql, count, and, gte, lte } from 'drizzle-orm';
import { db } from './drizzle';
import * as schema from './schema';

/**
 * 数据库服务类
 * 提供对数据库的操作方法
 */
export class DbService {
  /**
   * 保存系统指标数据
   */
  async saveMetrics(metrics: schema.NewSystemMetric): Promise<schema.SystemMetric> {
    try {
      const result = await db.insert(schema.systemMetrics).values(metrics).returning();
      return result[0];
    } catch (error) {
      console.error('保存系统指标失败:', error);
      throw error;
    }
  }

  /**
   * 获取最新的系统指标
   */
  async getLatestMetrics(): Promise<schema.SystemMetric | null> {
    try {
      const results = await db.select()
        .from(schema.systemMetrics)
        .orderBy(desc(schema.systemMetrics.createdAt))
        .limit(1);
      
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      console.error('获取最新系统指标失败:', error);
      throw error;
    }
  }

  /**
   * 获取历史系统指标
   * @param limit 返回结果数量
   * @param offset 查询偏移量
   */
  async getHistoricalMetrics(limit = 10, offset = 0): Promise<schema.SystemMetric[]> {
    try {
      return await db.select()
        .from(schema.systemMetrics)
        .orderBy(desc(schema.systemMetrics.createdAt))
        .limit(limit)
        .offset(offset);
    } catch (error) {
      console.error('获取历史系统指标失败:', error);
      throw error;
    }
  }

  /**
   * 添加异常记录
   */
  async addAnomaly(anomaly: schema.NewAnomaly): Promise<schema.Anomaly> {
    try {
      const result = await db.insert(schema.anomalies).values(anomaly).returning();
      return result[0];
    } catch (error) {
      console.error('添加异常记录失败:', error);
      throw error;
    }
  }

  /**
   * 更新异常状态
   */
  async updateAnomalyStatus(id: number, status: string, resolvedAt?: Date): Promise<schema.Anomaly | null> {
    try {
      const updateData: Partial<schema.Anomaly> = { status };
      if (resolvedAt) {
        updateData.resolvedAt = resolvedAt;
      }

      const result = await db.update(schema.anomalies)
        .set(updateData)
        .where(eq(schema.anomalies.id, id))
        .returning();
      
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error('更新异常状态失败:', error);
      throw error;
    }
  }

  /**
   * 获取未解决的异常
   */
  async getOpenAnomalies(): Promise<schema.Anomaly[]> {
    try {
      return await db.select()
        .from(schema.anomalies)
        .where(eq(schema.anomalies.status, 'open'))
        .orderBy(desc(schema.anomalies.detectedAt));
    } catch (error) {
      console.error('获取未解决异常失败:', error);
      throw error;
    }
  }

  /**
   * 记录系统事件
   */
  async logSystemEvent(event: schema.NewSystemEvent): Promise<schema.SystemEvent> {
    try {
      const result = await db.insert(schema.systemEvents).values(event).returning();
      return result[0];
    } catch (error) {
      console.error('记录系统事件失败:', error);
      throw error;
    }
  }

  /**
   * 获取指定时间范围内的系统事件
   */
  async getSystemEvents(startDate: Date, endDate: Date, limit = 100): Promise<schema.SystemEvent[]> {
    try {
      return await db.select()
        .from(schema.systemEvents)
        .where(
          and(
            gte(schema.systemEvents.createdAt, startDate),
            lte(schema.systemEvents.createdAt, endDate)
          )
        )
        .orderBy(desc(schema.systemEvents.createdAt))
        .limit(limit);
    } catch (error) {
      console.error('获取系统事件失败:', error);
      throw error;
    }
  }

  /**
   * 保存或更新配置
   */
  async saveConfig(key: string, value: string, category: string, description?: string, isSecret = false): Promise<schema.Config> {
    try {
      // 检查配置是否存在
      const existing = await db.select()
        .from(schema.configs)
        .where(eq(schema.configs.key, key));
      
      if (existing.length > 0) {
        // 更新现有配置
        const result = await db.update(schema.configs)
          .set({ 
            value,
            description,
            category,
            isSecret,
            updatedAt: new Date()
          })
          .where(eq(schema.configs.key, key))
          .returning();
        
        return result[0];
      } else {
        // 创建新配置
        const result = await db.insert(schema.configs)
          .values({
            key,
            value,
            description,
            category,
            isSecret
          })
          .returning();
        
        return result[0];
      }
    } catch (error) {
      console.error('保存配置失败:', error);
      throw error;
    }
  }

  /**
   * 获取配置值
   */
  async getConfig(key: string): Promise<schema.Config | null> {
    try {
      const results = await db.select()
        .from(schema.configs)
        .where(eq(schema.configs.key, key));
      
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      console.error('获取配置失败:', error);
      throw error;
    }
  }

  /**
   * 记录修复操作
   */
  async logRepairAction(repairLog: schema.NewRepairLog): Promise<schema.RepairLog> {
    try {
      const result = await db.insert(schema.repairLogs).values(repairLog).returning();
      return result[0];
    } catch (error) {
      console.error('记录修复操作失败:', error);
      throw error;
    }
  }

  /**
   * 更新修复操作结果
   */
  async updateRepairResult(id: number, status: string, result: string): Promise<schema.RepairLog | null> {
    try {
      const updateData = {
        status,
        result,
        completedAt: new Date()
      };

      const updateResult = await db.update(schema.repairLogs)
        .set(updateData)
        .where(eq(schema.repairLogs.id, id))
        .returning();
      
      return updateResult.length > 0 ? updateResult[0] : null;
    } catch (error) {
      console.error('更新修复操作结果失败:', error);
      throw error;
    }
  }
} 