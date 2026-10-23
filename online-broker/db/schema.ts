import { sqliteTable, text, index } from 'drizzle-orm/sqlite-core';
export const properties = sqliteTable('properties', {
  id: text('id').primaryKey(), ownerId: text('owner_id').notNull(),
  data: text('data').notNull(), review: text('review').notNull(),
  feedback: text('feedback').notNull().default(''),
  createdAt: text('created_at').notNull(), updatedAt: text('updated_at').notNull(),
}, t => [index('properties_owner').on(t.ownerId), index('properties_review').on(t.review)]);
export const photos = sqliteTable('photos', {
  id: text('id').primaryKey(), ownerId: text('owner_id').notNull(),
  mime: text('mime').notNull(), createdAt: text('created_at').notNull(),
}, t => [index('photos_owner').on(t.ownerId)]);
