// 导出所有表定义
export * from './datasources';
export * from './metrics';

// 类型定义
import { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { systemMetrics } from './metrics';

// 系统指标类型
export type SystemMetric = InferSelectModel<typeof systemMetrics>;
export type NewSystemMetric = InferInsertModel<typeof systemMetrics>; 