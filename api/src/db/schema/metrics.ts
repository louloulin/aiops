import { pgTable, serial, timestamp, real, bigint } from 'drizzle-orm/pg-core';

// 系统指标表定义 - 用于存储系统监控数据
export const systemMetrics = pgTable('system_metrics', {
  id: serial('id').primaryKey(),
  cpuUsage: real('cpu_usage').notNull(), // CPU使用率 (%)
  cpuTemperature: real('cpu_temperature').notNull(), // CPU温度 (°C)
  memoryUsed: bigint('memory_used', { mode: 'number' }).notNull(), // 已使用内存 (bytes)
  memoryTotal: bigint('memory_total', { mode: 'number' }).notNull(), // 总内存 (bytes)
  memoryFree: bigint('memory_free', { mode: 'number' }).notNull(), // 剩余内存 (bytes)
  diskUsed: bigint('disk_used', { mode: 'number' }).notNull(), // 已使用磁盘空间 (bytes)
  diskTotal: bigint('disk_total', { mode: 'number' }).notNull(), // 总磁盘空间 (bytes)
  diskFree: bigint('disk_free', { mode: 'number' }).notNull(), // 剩余磁盘空间 (bytes)
  networkBytesIn: bigint('network_bytes_in', { mode: 'number' }).notNull(), // 网络入流量 (bytes/s)
  networkBytesOut: bigint('network_bytes_out', { mode: 'number' }).notNull(), // 网络出流量 (bytes/s)
  createdAt: timestamp('created_at').defaultNow().notNull(), // 创建时间
}); 