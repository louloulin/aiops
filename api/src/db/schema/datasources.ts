import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const datasources = sqliteTable('datasources', {
  id: text('id').primaryKey().notNull(),
  name: text('name').notNull(),
  type: text('type').notNull(), // prometheus, grafana, elasticsearch, cloudwatch, database, custom
  url: text('url').notNull(),
  description: text('description'),
  status: text('status').notNull().default('pending'), // connected, error, pending
  credentials: text('credentials'), // JSON string for credentials
  lastSync: text('lastSync'), // nullable, stored as ISO string
  metrics: integer('metrics').default(0),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at')
}); 