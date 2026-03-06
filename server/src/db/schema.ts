import {
    pgTable,
    uuid,
    text,
    varchar,
    boolean,
    timestamp,
    integer,
    decimal,
    jsonb,
    unique,
    index,
    pgEnum
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const entryTypeEnum = pgEnum('EntryType', ['MOVIE', 'TV_SHOW', 'EPISODE']);
export const notificationTypeEnum = pgEnum('NotificationType', [
    'FOLLOW', 'FOLLOW_REQUEST', 'FOLLOW_ACCEPT', 'LIKE', 'COMMENT', 'REPLY', 'MENTION'
]);

// Users Table
export const users = pgTable('users', {
    id: uuid('id').defaultRandom().primaryKey(),
    username: varchar('username', { length: 255 }).unique().notNull(),
    email: varchar('email', { length: 255 }).unique().notNull(),
    passwordHash: text('password_hash'),
    googleId: varchar('google_id', { length: 255 }).unique(),
    displayName: varchar('display_name', { length: 255 }),
    bio: text('bio'),
    profilePictureUrl: text('profile_picture_url'),
    location: varchar('location', { length: 255 }),
    isPrivate: boolean('is_private').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Entries Table
export const entries = pgTable('entries', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    tmdbId: integer('tmdb_id').notNull(),
    title: text('title').notNull(),
    type: entryTypeEnum('type').notNull(),
    watchedAt: timestamp('watched_at').notNull(),
    rating: decimal('rating', { precision: 3, scale: 1 }),
    review: text('review'),
    tags: text('tags').array(),
    isRewatch: boolean('is_rewatch').default(false).notNull(),
    watchLocation: text('watch_location'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
    userIndex: index('entries_user_id_idx').on(table.userId),
    watchedAtIndex: index('entries_watched_at_idx').on(table.watchedAt),
    tmdbIndex: index('entries_tmdb_id_idx').on(table.tmdbId),
}));

// Follows Table
export const follows = pgTable('follows', {
    id: uuid('id').defaultRandom().primaryKey(),
    followerId: uuid('follower_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    followingId: uuid('following_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
    uniqueFollow: unique().on(table.followerId, table.followingId),
    followerIndex: index('follows_follower_id_idx').on(table.followerId),
    followingIndex: index('follows_following_id_idx').on(table.followingId),
}));

// Follow Requests Table
export const followRequests = pgTable('follow_requests', {
    id: uuid('id').defaultRandom().primaryKey(),
    senderId: uuid('sender_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    recipientId: uuid('recipient_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    status: varchar('status', { length: 20 }).default('pending').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
    uniqueRequest: unique().on(table.senderId, table.recipientId),
    senderIndex: index('follow_requests_sender_id_idx').on(table.senderId),
    recipientIndex: index('follow_requests_recipient_id_idx').on(table.recipientId),
}));

// Likes Table
export const likes = pgTable('likes', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    entryId: uuid('entry_id').references(() => entries.id, { onDelete: 'cascade' }).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
    uniqueLike: unique().on(table.userId, table.entryId),
    userIndex: index('likes_user_id_idx').on(table.userId),
    entryIndex: index('likes_entry_id_idx').on(table.entryId),
}));

// Comments Table
export const comments = pgTable('comments', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    entryId: uuid('entry_id').references(() => entries.id, { onDelete: 'cascade' }).notNull(),
    parentCommentId: uuid('parent_comment_id'),
    content: text('content').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
    userIndex: index('comments_user_id_idx').on(table.userId),
    entryIndex: index('comments_entry_id_idx').on(table.entryId),
    parentIndex: index('comments_parent_comment_id_idx').on(table.parentCommentId),
}));

// Lists Table
export const lists = pgTable('lists', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    isPublic: boolean('is_public').default(true).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
    userIndex: index('lists_user_id_idx').on(table.userId),
}));

// List Items Table
export const listItems = pgTable('list_items', {
    id: uuid('id').defaultRandom().primaryKey(),
    listId: uuid('list_id').references(() => lists.id, { onDelete: 'cascade' }).notNull(),
    tmdbId: integer('tmdb_id').notNull(),
    mediaType: varchar('media_type', { length: 20 }).default('movie').notNull(),
    orderIndex: integer('order_index').notNull(),
    addedAt: timestamp('added_at').defaultNow().notNull(),
}, (table) => ({
    listIndex: index('list_items_list_id_idx').on(table.listId),
}));

// Notifications Table
export const notifications = pgTable('notifications', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    type: notificationTypeEnum('type').notNull(),
    content: jsonb('content').notNull(),
    isRead: boolean('is_read').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
    userIndex: index('notifications_user_id_idx').on(table.userId),
    readIndex: index('notifications_is_read_idx').on(table.isRead),
}));

// Relations Definitions
export const usersRelations = relations(users, ({ many }) => ({
    entries: many(entries),
    followers: many(follows, { relationName: 'followers' }),
    following: many(follows, { relationName: 'following' }),
    likes: many(likes),
    comments: many(comments),
    lists: many(lists),
    notifications: many(notifications),
}));

export const entriesRelations = relations(entries, ({ one, many }) => ({
    user: one(users, { fields: [entries.userId], references: [users.id] }),
    likes: many(likes),
    comments: many(comments),
}));

export const followsRelations = relations(follows, ({ one }) => ({
    follower: one(users, { fields: [follows.followerId], references: [users.id], relationName: 'followers' }),
    following: one(users, { fields: [follows.followingId], references: [users.id], relationName: 'following' }),
}));

export const likesRelations = relations(likes, ({ one }) => ({
    user: one(users, { fields: [likes.userId], references: [users.id] }),
    entry: one(entries, { fields: [likes.entryId], references: [entries.id] }),
}));

export const commentsRelations = relations(comments, ({ one, many }) => ({
    user: one(users, { fields: [comments.userId], references: [users.id] }),
    entry: one(entries, { fields: [comments.entryId], references: [entries.id] }),
    parentComment: one(comments, { fields: [comments.parentCommentId], references: [comments.id], relationName: 'replies' }),
    replies: many(comments, { relationName: 'replies' }),
}));

export const listsRelations = relations(lists, ({ one, many }) => ({
    user: one(users, { fields: [lists.userId], references: [users.id] }),
    items: many(listItems),
}));

export const listItemsRelations = relations(listItems, ({ one }) => ({
    list: one(lists, { fields: [listItems.listId], references: [lists.id] }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
    user: one(users, { fields: [notifications.userId], references: [users.id] }),
}));
