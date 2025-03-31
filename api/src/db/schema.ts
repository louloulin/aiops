import { pgTable, serial, text, varchar, timestamp, integer, bigint, doublePrecision, boolean } from 'drizzle-orm/pg-core';

/**
 * 系统指标表
 * 存储CPU、内存、磁盘和网络等系统性能指标
 */
export const systemMetrics = pgTable('system_metrics', {
  id: serial('id').primaryKey(),
  cpuUsage: doublePrecision('cpu_usage').notNull(), // CPU使用率 (百分比)
  cpuTemperature: doublePrecision('cpu_temperature').notNull(), // CPU温度 (摄氏度)
  memoryTotal: bigint('memory_total', { mode: 'number' }).notNull(), // 总内存 (bytes)
  memoryUsed: bigint('memory_used', { mode: 'number' }).notNull(), // 已使用内存 (bytes)
  memoryFree: bigint('memory_free', { mode: 'number' }).notNull(), // 空闲内存 (bytes)
  diskTotal: bigint('disk_total', { mode: 'number' }).notNull(), // 总磁盘空间 (bytes)
  diskUsed: bigint('disk_used', { mode: 'number' }).notNull(), // 已使用磁盘空间 (bytes)
  diskFree: bigint('disk_free', { mode: 'number' }).notNull(), // 空闲磁盘空间 (bytes)
  networkBytesIn: bigint('network_bytes_in', { mode: 'number' }).notNull(), // 入站流量 (bytes)
  networkBytesOut: bigint('network_bytes_out', { mode: 'number' }).notNull(), // 出站流量 (bytes)
  createdAt: timestamp('created_at').defaultNow(), // 创建时间
});

/**
 * 异常检测表
 * 存储系统检测到的各类异常
 */
export const anomalies = pgTable('anomalies', {
  id: serial('id').primaryKey(),
  component: varchar('component', { length: 50 }).notNull(), // 组件名称
  severity: varchar('severity', { length: 20 }).notNull(), // 严重程度: critical, warning, info
  message: text('message').notNull(), // 异常详细信息
  detectedAt: timestamp('detected_at').defaultNow(), // 检测时间
  resolvedAt: timestamp('resolved_at'), // 解决时间
  status: varchar('status', { length: 20 }).default('open').notNull(), // 状态: open, resolved
});

/**
 * 系统事件表
 * 存储系统中发生的各类事件
 */
export const systemEvents = pgTable('system_events', {
  id: serial('id').primaryKey(),
  eventType: varchar('event_type', { length: 50 }).notNull(), // 事件类型
  source: varchar('source', { length: 50 }).notNull(), // 事件来源
  description: text('description').notNull(), // 事件描述
  severity: varchar('severity', { length: 20 }).notNull(), // 严重程度: critical, warning, info
  createdAt: timestamp('created_at').defaultNow(), // 创建时间
});

/**
 * 系统配置表
 * 存储应用程序配置信息
 */
export const configs = pgTable('configs', {
  id: serial('id').primaryKey(),
  key: varchar('key', { length: 100 }).notNull().unique(), // 配置键
  value: text('value').notNull(), // 配置值
  description: text('description'), // 配置描述
  category: varchar('category', { length: 50 }).notNull(), // 配置类别
  isSecret: boolean('is_secret').default(false), // 是否为敏感信息
  updatedAt: timestamp('updated_at').defaultNow(), // 更新时间
});

/**
 * 修复操作日志表
 * 记录系统自动修复操作
 */
export const repairLogs = pgTable('repair_logs', {
  id: serial('id').primaryKey(),
  issueId: integer('issue_id'), // 关联的问题ID
  actionType: varchar('action_type', { length: 50 }).notNull(), // 修复动作类型
  description: text('description').notNull(), // 操作描述
  status: varchar('status', { length: 20 }).notNull(), // 状态: success, failed, pending
  result: text('result'), // 操作结果
  startedAt: timestamp('started_at').defaultNow(), // 开始时间
  completedAt: timestamp('completed_at'), // 完成时间
});

/**
 * 业务指标表
 * 存储自定义的业务指标定义
 */
export const businessMetrics = pgTable('business_metrics', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(), // 指标名称
  description: text('description'), // 指标描述
  category: varchar('category', { length: 50 }).notNull(), // 指标类别: user, performance, business, quality, custom
  query: text('query').notNull(), // 查询表达式
  dataSource: varchar('data_source', { length: 100 }).notNull(), // 数据源
  warningThreshold: doublePrecision('warning_threshold'), // 警告阈值
  criticalThreshold: doublePrecision('critical_threshold'), // 严重阈值
  unit: varchar('unit', { length: 20 }), // 单位
  aggregation: varchar('aggregation', { length: 20 }).notNull(), // 聚合方式: avg, sum, min, max, count
  createdAt: timestamp('created_at').defaultNow(), // 创建时间
  updatedAt: timestamp('updated_at').defaultNow(), // 更新时间
  status: varchar('status', { length: 20 }).default('active').notNull(), // 状态: active, inactive, draft
});

/**
 * 业务指标数据表
 * 存储业务指标的历史数据
 */
export const businessMetricsData = pgTable('business_metrics_data', {
  id: serial('id').primaryKey(),
  metricId: integer('metric_id').notNull(), // 关联的业务指标ID
  value: doublePrecision('value').notNull(), // 指标值
  timestamp: timestamp('timestamp').defaultNow(), // 时间戳
});

// 导出类型，用于类型安全的查询
export type SystemMetric = typeof systemMetrics.$inferSelect;
export type NewSystemMetric = typeof systemMetrics.$inferInsert;

export type Anomaly = typeof anomalies.$inferSelect;
export type NewAnomaly = typeof anomalies.$inferInsert;

export type SystemEvent = typeof systemEvents.$inferSelect;
export type NewSystemEvent = typeof systemEvents.$inferInsert;

export type Config = typeof configs.$inferSelect;
export type NewConfig = typeof configs.$inferInsert;

export type RepairLog = typeof repairLogs.$inferSelect;
export type NewRepairLog = typeof repairLogs.$inferInsert;

export type BusinessMetric = typeof businessMetrics.$inferSelect;
export type NewBusinessMetric = typeof businessMetrics.$inferInsert;

export type BusinessMetricData = typeof businessMetricsData.$inferSelect;
export type NewBusinessMetricData = typeof businessMetricsData.$inferInsert; 