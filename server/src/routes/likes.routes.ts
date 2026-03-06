import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { db } from '../db/index.js';
import { users, entries, likes } from '../db/schema.js';
import { eq, and, desc, count } from 'drizzle-orm';
import notificationService from '../services/notification.service.js';

const router = Router();

/**
 * @route   POST /api/likes/:entryId
 * @desc    Like an entry
 * @access  Private
 */
router.post('/:entryId', authMiddleware, async (req: Request, res: Response): Promise<void> => {
    try {
        const entryId = req.params.entryId;
        const userId = req.user!.userId;

        // Check if entry exists
        const [entry] = await db
            .select()
            .from(entries)
            .where(eq(entries.id, entryId))
            .limit(1);

        if (!entry) {
            res.status(404).json({ error: 'Entry not found' });
            return;
        }

        // Check if already liked
        const [existingLike] = await db
            .select()
            .from(likes)
            .where(and(eq(likes.userId, userId), eq(likes.entryId, entryId)))
            .limit(1);

        if (existingLike) {
            res.status(400).json({ error: 'You have already liked this entry' });
            return;
        }

        // Create like
        await db.insert(likes).values({
            userId,
            entryId,
        });

        // Fetch like details for notification and response parity
        const [like] = await db
            .select({
                id: likes.id,
                userId: likes.userId,
                entryId: likes.entryId,
                createdAt: likes.createdAt,
                user: {
                    username: users.username,
                    displayName: users.displayName
                },
                entry: {
                    id: entries.id,
                    userId: entries.userId,
                    title: entries.title,
                    type: entries.type,
                }
            })
            .from(likes)
            .innerJoin(users, eq(likes.userId, users.id))
            .innerJoin(entries, eq(likes.entryId, entries.id))
            .where(and(eq(likes.userId, userId), eq(likes.entryId, entryId)))
            .limit(1);

        // Get updated like count
        const [[{ likeCount }]] = await Promise.all([
            db.select({ likeCount: count() }).from(likes).where(eq(likes.entryId, entryId))
        ]);

        // Notify the entry owner
        if (like.entry.userId !== userId) {
            await notificationService.createNotification(like.entry.userId, 'LIKE', {
                actorId: userId,
                actorName: like.user.displayName || like.user.username,
                entryId: like.entry.id,
                entryTitle: like.entry.title,
                type: like.entry.type
            });
        }

        res.status(201).json({
            message: 'Successfully liked entry',
            like,
            likeCount,
        });
    } catch (error) {
        console.error('Error liking entry:', error);
        res.status(500).json({ error: 'Failed to like entry' });
    }
});

/**
 * @route   DELETE /api/likes/:entryId
 * @desc    Unlike an entry
 * @access  Private
 */
router.delete('/:entryId', authMiddleware, async (req: Request, res: Response): Promise<void> => {
    try {
        const entryId = req.params.entryId;
        const userId = req.user!.userId;

        // Check if like exists
        const [existingLike] = await db
            .select()
            .from(likes)
            .where(and(eq(likes.userId, userId), eq(likes.entryId, entryId)))
            .limit(1);

        if (!existingLike) {
            res.status(404).json({ error: 'You have not liked this entry' });
            return;
        }

        // Delete like
        await db
            .delete(likes)
            .where(and(eq(likes.userId, userId), eq(likes.entryId, entryId)));

        // Get updated like count
        const [{ likeCount }] = await db
            .select({ likeCount: count() })
            .from(likes)
            .where(eq(likes.entryId, entryId));

        res.json({
            message: 'Successfully unliked entry',
            likeCount,
        });
    } catch (error) {
        console.error('Error unliking entry:', error);
        res.status(500).json({ error: 'Failed to unlike entry' });
    }
});

/**
 * @route   GET /api/likes/:entryId
 * @desc    Get all likes for an entry
 * @access  Private
 */
router.get('/:entryId', authMiddleware, async (req: Request, res: Response): Promise<void> => {
    try {
        const entryId = req.params.entryId;
        const page = parseInt(req.query.page as string, 10) || 1;
        const limit = parseInt(req.query.limit as string, 10) || 20;
        const offset = (page - 1) * limit;

        // Get likes
        const [likesList, [{ total }]] = await Promise.all([
            db.select({
                id: users.id,
                username: users.username,
                displayName: users.displayName,
                profilePictureUrl: users.profilePictureUrl,
            })
                .from(likes)
                .innerJoin(users, eq(likes.userId, users.id))
                .where(eq(likes.entryId, entryId))
                .limit(limit)
                .offset(offset)
                .orderBy(desc(likes.createdAt)),
            db.select({ total: count() }).from(likes).where(eq(likes.entryId, entryId))
        ]);

        res.json({
            likes: likesList,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Error getting likes:', error);
        res.status(500).json({ error: 'Failed to get likes' });
    }
});

/**
 * @route   GET /api/likes/:entryId/status
 * @desc    Check if current user has liked an entry
 * @access  Private
 */
router.get('/:entryId/status', authMiddleware, async (req: Request, res: Response): Promise<void> => {
    try {
        const entryId = req.params.entryId;
        const userId = req.user!.userId;

        // Check if liked and get total like count
        const [[like], [{ likeCount }]] = await Promise.all([
            db.select().from(likes).where(and(eq(likes.userId, userId), eq(likes.entryId, entryId))).limit(1),
            db.select({ likeCount: count() }).from(likes).where(eq(likes.entryId, entryId))
        ]);

        res.json({
            isLiked: !!like,
            likedAt: like?.createdAt || null,
            likeCount,
        });
    } catch (error) {
        console.error('Error checking like status:', error);
        res.status(500).json({ error: 'Failed to check like status' });
    }
});

/**
 * @route   GET /api/likes/user/:userId
 * @desc    Get all entries liked by a user
 * @access  Private
 */
router.get('/user/:userId', authMiddleware, async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.params.userId;
        const page = parseInt(req.query.page as string, 10) || 1;
        const limit = parseInt(req.query.limit as string, 10) || 20;
        const offset = (page - 1) * limit;

        // Get liked entries with their user details
        const [likesList, [{ total }]] = await Promise.all([
            db.select({
                id: entries.id,
                userId: entries.userId,
                tmdbId: entries.tmdbId,
                title: entries.title,
                type: entries.type,
                watchedAt: entries.watchedAt,
                rating: entries.rating,
                review: entries.review,
                tags: entries.tags,
                isRewatch: entries.isRewatch,
                watchLocation: entries.watchLocation,
                createdAt: entries.createdAt,
                updatedAt: entries.updatedAt,
                user: {
                    id: users.id,
                    username: users.username,
                    displayName: users.displayName,
                    profilePictureUrl: users.profilePictureUrl,
                }
            })
                .from(likes)
                .innerJoin(entries, eq(likes.entryId, entries.id))
                .innerJoin(users, eq(entries.userId, users.id))
                .where(eq(likes.userId, userId))
                .limit(limit)
                .offset(offset)
                .orderBy(desc(likes.createdAt)),
            db.select({ total: count() }).from(likes).where(eq(likes.userId, userId))
        ]);

        res.json({
            entries: likesList,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Error getting liked entries:', error);
        res.status(500).json({ error: 'Failed to get liked entries' });
    }
});

export default router;
