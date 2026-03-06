import { db } from '../db/index.js';
import { notifications } from '../db/schema.js';
import { eq, and, desc, count } from 'drizzle-orm';

export const notificationService = {
    /**
     * Create a notification for a user
     */
    createNotification: async (
        userId: string,
        type: any, // type will match the NotificationType enum from schema
        content: any
    ) => {
        try {
            // Don't notify yourself
            if (content.actorId === userId) return null;

            const [newNotification] = await db.insert(notifications).values({
                userId,
                type,
                content,
            }).returning();

            return newNotification;
        } catch (error) {
            console.error('Error creating notification:', error);
            return null;
        }
    },

    /**
     * Get user notifications
     */
    getNotifications: async (userId: string, page = 1, limit = 20) => {
        const offset = (page - 1) * limit;
        return await db
            .select()
            .from(notifications)
            .where(eq(notifications.userId, userId))
            .orderBy(desc(notifications.createdAt))
            .limit(limit)
            .offset(offset);
    },

    /**
     * Mark notification as read
     */
    markAsRead: async (notificationId: string, userId: string) => {
        return await db
            .update(notifications)
            .set({ isRead: true })
            .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)));
    },

    /**
     * Mark all notifications as read
     */
    markAllAsRead: async (userId: string) => {
        return await db
            .update(notifications)
            .set({ isRead: true })
            .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
    },

    /**
     * Get unread count
     */
    getUnreadCount: async (userId: string) => {
        const [result] = await db
            .select({ value: count() })
            .from(notifications)
            .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
        return result?.value || 0;
    }
};

export default notificationService;
