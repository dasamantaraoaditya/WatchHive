import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { db } from '../db/index.js';
import { entries, comments } from '../db/schema.js';
import { eq, and, desc, count, isNull } from 'drizzle-orm';
import notificationService from '../services/notification.service.js';

const router = Router();

/**
 * @route   POST /api/comments/:entryId
 * @desc    Add a comment to an entry
 * @access  Private
 */
router.post(
    '/:entryId',
    authMiddleware,
    [body('content').trim().notEmpty().withMessage('Comment cannot be empty')],
    async (req: Request, res: Response): Promise<void> => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ errors: errors.array() });
                return;
            }

            const { entryId } = req.params;
            const { content, parentCommentId } = req.body;
            const userId = req.user!.userId;

            // Check if entry exists
            const [entry] = await db
                .select({
                    id: entries.id,
                    userId: entries.userId,
                    title: entries.title
                })
                .from(entries)
                .where(eq(entries.id, entryId))
                .limit(1);

            if (!entry) {
                res.status(404).json({ error: 'Entry not found' });
                return;
            }

            // Create comment
            const [newComment] = await db
                .insert(comments)
                .values({
                    content,
                    userId,
                    entryId,
                    parentCommentId: parentCommentId || null,
                })
                .returning();

            // Fetch fully populated comment for response and notifications
            const comment = await db.query.comments.findFirst({
                where: eq(comments.id, newComment.id),
                with: {
                    user: {
                        columns: {
                            id: true,
                            username: true,
                            displayName: true,
                            profilePictureUrl: true,
                        }
                    },
                    parentComment: {
                        columns: {
                            userId: true
                        }
                    }
                }
            });

            if (!comment) {
                res.status(500).json({ error: 'Failed to retrieve created comment' });
                return;
            }

            // Get updated comment count
            const [{ commentCount }] = await db
                .select({ commentCount: count() })
                .from(comments)
                .where(eq(comments.entryId, entryId));

            // --- Send Notifications ---
            const actorName = comment.user.displayName || comment.user.username;

            // 1. Notify Parent Comment Owner (if it's a reply)
            if (comment.parentComment && comment.parentComment.userId !== userId) {
                await notificationService.createNotification(comment.parentComment.userId, 'REPLY', {
                    actorId: userId,
                    actorName,
                    entryId,
                    commentId: comment.id,
                    contentSnippet: content.substring(0, 50),
                    entryTitle: entry.title
                });
            }
            // 2. Notify Entry Owner (if it's not a reply or if the entry owner is NOT the parent comment owner)
            else if (entry.userId !== userId) {
                await notificationService.createNotification(entry.userId, 'COMMENT', {
                    actorId: userId,
                    actorName,
                    entryId,
                    commentId: comment.id,
                    contentSnippet: content.substring(0, 50),
                    entryTitle: entry.title
                });
            }

            res.status(201).json({
                message: 'Comment added',
                comment,
                commentCount
            });
        } catch (error) {
            console.error('Error adding comment:', error);
            res.status(500).json({ error: 'Failed to add comment' });
        }
    }
);

/**
 * @route   GET /api/comments/:entryId
 * @desc    Get comments for an entry
 * @access  Private
 */
router.get('/:entryId', authMiddleware, async (req: Request, res: Response): Promise<void> => {
    try {
        const { entryId } = req.params;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 50;
        const offset = (page - 1) * limit;

        const [commentsList, [{ total }]] = await Promise.all([
            db.query.comments.findMany({
                where: and(eq(comments.entryId, entryId), isNull(comments.parentCommentId)),
                limit,
                offset,
                orderBy: desc(comments.createdAt),
                with: {
                    user: {
                        columns: {
                            id: true,
                            username: true,
                            displayName: true,
                            profilePictureUrl: true,
                        }
                    },
                    replies: {
                        with: {
                            user: {
                                columns: {
                                    id: true,
                                    username: true,
                                    displayName: true,
                                    profilePictureUrl: true,
                                }
                            }
                        },
                        orderBy: (replies, { asc }) => [asc(replies.createdAt)]
                    }
                }
            }),
            db.select({ total: count() }).from(comments).where(and(eq(comments.entryId, entryId), isNull(comments.parentCommentId))),
        ]);

        res.json({
            comments: commentsList,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Error fetching comments:', error);
        res.status(500).json({ error: 'Failed to fetch comments' });
    }
});

/**
 * @route   DELETE /api/comments/:commentId
 * @desc    Delete a comment
 * @access  Private (Owner or Entry Owner)
 */
router.delete('/:commentId', authMiddleware, async (req: Request, res: Response): Promise<void> => {
    try {
        const { commentId } = req.params;
        const userId = req.user!.userId;

        const comment = await db.query.comments.findFirst({
            where: eq(comments.id, commentId),
            with: { entry: true },
        });

        if (!comment) {
            res.status(404).json({ error: 'Comment not found' });
            return;
        }

        // Allow deletion if user owns comment OR user owns the entry
        if (comment.userId !== userId && comment.entry.userId !== userId) {
            res.status(403).json({ error: 'Not authorized to delete this comment' });
            return;
        }

        await db.delete(comments).where(eq(comments.id, commentId));

        const [{ commentCount }] = await db
            .select({ commentCount: count() })
            .from(comments)
            .where(eq(comments.entryId, comment.entryId));

        res.json({ message: 'Comment deleted', commentCount });
    } catch (error) {
        console.error('Error deleting comment:', error);
        res.status(500).json({ error: 'Failed to delete comment' });
    }
});

export default router;
