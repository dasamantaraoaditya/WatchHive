import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import prisma from '../utils/prisma.js';

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
        const entry = await prisma.entry.findUnique({
            where: { id: entryId },
        });

        if (!entry) {
            res.status(404).json({ error: 'Entry not found' });
            return;
        }

        // Check if already liked
        const existingLike = await prisma.like.findUnique({
            where: {
                userId_entryId: {
                    userId,
                    entryId,
                },
            },
        });

        if (existingLike) {
            res.status(400).json({ error: 'You have already liked this entry' });
            return;
        }

        // Create like
        const like = await prisma.like.create({
            data: {
                userId,
                entryId,
            },
            include: {
                entry: {
                    select: {
                        id: true,
                        title: true,
                        type: true,
                    },
                },
            },
        });

        // Get updated like count
        const likeCount = await prisma.like.count({
            where: { entryId },
        });

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
        const existingLike = await prisma.like.findUnique({
            where: {
                userId_entryId: {
                    userId,
                    entryId,
                },
            },
        });

        if (!existingLike) {
            res.status(404).json({ error: 'You have not liked this entry' });
            return;
        }

        // Delete like
        await prisma.like.delete({
            where: {
                userId_entryId: {
                    userId,
                    entryId,
                },
            },
        });

        // Get updated like count
        const likeCount = await prisma.like.count({
            where: { entryId },
        });

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
        const skip = (page - 1) * limit;

        // Get likes
        const [likes, total] = await Promise.all([
            prisma.like.findMany({
                where: { entryId },
                skip,
                take: limit,
                include: {
                    user: {
                        select: {
                            id: true,
                            username: true,
                            displayName: true,
                            profilePictureUrl: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: 'desc',
                },
            }),
            prisma.like.count({
                where: { entryId },
            }),
        ]);

        res.json({
            likes: likes.map((l) => l.user),
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

        // Check if liked
        const like = await prisma.like.findUnique({
            where: {
                userId_entryId: {
                    userId,
                    entryId,
                },
            },
        });

        // Get total like count
        const likeCount = await prisma.like.count({
            where: { entryId },
        });

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
        const skip = (page - 1) * limit;

        // Get liked entries
        const [likes, total] = await Promise.all([
            prisma.like.findMany({
                where: { userId },
                skip,
                take: limit,
                include: {
                    entry: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    username: true,
                                    displayName: true,
                                    profilePictureUrl: true,
                                },
                            },
                        },
                    },
                },
                orderBy: {
                    createdAt: 'desc',
                },
            }),
            prisma.like.count({
                where: { userId },
            }),
        ]);

        res.json({
            entries: likes.map((l) => l.entry),
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
