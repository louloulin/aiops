-- 创建系统指标表
CREATE TABLE IF NOT EXISTS "system_metrics" (
  "id" SERIAL PRIMARY KEY,
  "cpu_usage" REAL NOT NULL,
  "cpu_temperature" REAL NOT NULL,
  "memory_used" BIGINT NOT NULL,
  "memory_total" BIGINT NOT NULL,
  "disk_used" BIGINT NOT NULL,
  "disk_total" BIGINT NOT NULL,
  "network_bytes_in" BIGINT NOT NULL,
  "network_bytes_out" BIGINT NOT NULL,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
); 