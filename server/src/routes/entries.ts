import { Router, Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { PrismaClient, EntryType } from '@prisma/client';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();
const prisma = new PrismaClient();

// Validation middleware
const validateEntry = [
    body('tmdbId').isInt().withMessage('TMDb ID must be an integer'),
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('type').isIn(['MOVIE', 'TV_SHOW', 'EPISODE']).withMessage('Invalid entry type'),
    body('watchedAt').optional().isISO8601().withMessage('Invalid date format'),
    body('rating').optional().isInt({ min: 1, max: 10 }).withMessage('Rating must be between 1 and 10'),
    body('review').optional().trim(),
    body('tags').optional().isArray().withMessage('Tags must be an array'),
    body('isRewatch').optional().isBoolean().withMessage('isRewatch must be boolean'),
    body('watchLocation').optional().trim(),
];

// ============================================
// CREATE ENTRY
// ============================================
router.post(
    '/',
    authMiddleware,
    validateEntry,
    async (req: Request, res: Response): Promise<any> => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ errors: errors.array() });
                return;
            }

            const userId = (req as any).user.userId;
            const {
                tmdbId,
                title,
                type,
                watchedAt,
                rating,
                review,
                tags,
                isRewatch,
                watchLocation,
            } = req.body;

            // Create entry
            const entry = await prisma.entry.create({
                data: {
                    userId,
                    tmdbId,
                    title,
                    type: type as EntryType,
                    watchedAt: watchedAt ? new Date(watchedAt) : new Date(),
                    rating: rating || null,
                    review: review || null,
                    tags: tags || [],
                    isRewatch: isRewatch || false,
                    watchLocation: watchLocation || null,
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            username: true,
                            displayName: true,
                            profilePictureUrl: true,
                        },
                    },
                    _count: {
                        select: {
                            likes: true,
                            comments: true,
                        },
                    },
                },
            });

            res.status(201).json({
                message: 'Entry created successfully',
                entry,
            });
        } catch (error) {
            console.error('Create entry error:', error);
            res.status(500).json({ error: 'Failed to create entry' });
        }
    }
);

// ============================================
// GET ALL ENTRIES (with filters)
// ============================================
router.get('/', authMiddleware, async (req: Request, res: Response): Promise<any> => {
    try {
        const userId = (req as any).user.userId;
        const {
            type,
            rating,
            tag,
            search,
            limit = '20',
            offset = '0',
            sortBy = 'watchedAt',
            order = 'desc',
        } = req.query;

        // Build filter conditions
        const where: any = { userId };

        if (type) {
            where.type = type as EntryType;
        }

        if (rating) {
            where.rating = parseInt(rating as string);
        }

        if (tag) {
            where.tags = {
                has: tag as string,
            };
        }

        if (search) {
            where.OR = [
                { title: { contains: search as string, mode: 'insensitive' } },
                { review: { contains: search as string, mode: 'insensitive' } },
            ];
        }

        // Get entries with pagination
        const [entries, total] = await Promise.all([
            prisma.entry.findMany({
                where,
                include: {
                    user: {
                        select: {
                            id: true,
                            username: true,
                            displayName: true,
                            profilePictureUrl: true,
                        },
                    },
                    _count: {
                        select: {
                            likes: true,
                            comments: true,
                        },
                    },
                },
                orderBy: {
                    [sortBy as string]: order === 'asc' ? 'asc' : 'desc',
                },
                take: parseInt(limit as string),
                skip: parseInt(offset as string),
            }),
            prisma.entry.count({ where }),
        ]);

        res.json({
            entries,
            pagination: {
                total,
                limit: parseInt(limit as string),
                offset: parseInt(offset as string),
                hasMore: parseInt(offset as string) + entries.length < total,
            },
        });
    } catch (error) {
        console.error('Get entries error:', error);
        res.status(500).json({ error: 'Failed to fetch entries' });
    }
});

// ============================================
// GET SINGLE ENTRY
// ============================================
router.get(
    '/:id',
    authMiddleware,
    param('id').isUUID().withMessage('Invalid entry ID'),
    async (req: Request, res: Response): Promise<any> => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ errors: errors.array() });
                return;
            }

            const { id } = req.params;
            const userId = (req as any).user.userId;

            const entry = await prisma.entry.findFirst({
                where: {
                    id,
                    userId, // Ensure user can only access their own entries
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            username: true,
                            displayName: true,
                            profilePictureUrl: true,
                        },
                    },
                    likes: {
                        select: {
                            userId: true,
                        },
                    },
                    comments: {
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
                    },
                    _count: {
                        select: {
                            likes: true,
                            comments: true,
                        },
                    },
                },
            });

            if (!entry) {
                return res.status(404).json({ error: 'Entry not found' });
            }

            res.json({ entry });
        } catch (error) {
            console.error('Get entry error:', error);
            res.status(500).json({ error: 'Failed to fetch entry' });
        }
    }
);

// ============================================
// UPDATE ENTRY
// ============================================
router.put(
    '/:id',
    authMiddleware,
    param('id').isUUID().withMessage('Invalid entry ID'),
    [
        body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
        body('type').optional().isIn(['MOVIE', 'TV_SHOW', 'EPISODE']).withMessage('Invalid entry type'),
        body('watchedAt').optional().isISO8601().withMessage('Invalid date format'),
        body('rating').optional().isInt({ min: 1, max: 10 }).withMessage('Rating must be between 1 and 10'),
        body('review').optional().trim(),
        body('tags').optional().isArray().withMessage('Tags must be an array'),
        body('isRewatch').optional().isBoolean().withMessage('isRewatch must be boolean'),
        body('watchLocation').optional().trim(),
    ],
    async (req: Request, res: Response): Promise<any> => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ errors: errors.array() });
                return;
            }

            const { id } = req.params;
            const userId = (req as any).user.userId;

            // Check if entry exists and belongs to user
            const existingEntry = await prisma.entry.findFirst({
                where: { id, userId },
            });

            if (!existingEntry) {
                return res.status(404).json({ error: 'Entry not found' });
            }

            // Update entry
            const updatedEntry = await prisma.entry.update({
                where: { id },
                data: {
                    ...req.body,
                    watchedAt: req.body.watchedAt ? new Date(req.body.watchedAt) : undefined,
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            username: true,
                            displayName: true,
                            profilePictureUrl: true,
                        },
                    },
                    _count: {
                        select: {
                            likes: true,
                            comments: true,
                        },
                    },
                },
            });

            res.json({
                message: 'Entry updated successfully',
                entry: updatedEntry,
            });
        } catch (error) {
            console.error('Update entry error:', error);
            res.status(500).json({ error: 'Failed to update entry' });
        }
    }
);

// ============================================
// DELETE ENTRY
// ============================================
router.delete(
    '/:id',
    authMiddleware,
    param('id').isUUID().withMessage('Invalid entry ID'),
    async (req: Request, res: Response): Promise<any> => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ errors: errors.array() });
                return;
            }

            const { id } = req.params;
            const userId = (req as any).user.userId;

            // Check if entry exists and belongs to user
            const existingEntry = await prisma.entry.findFirst({
                where: { id, userId },
            });

            if (!existingEntry) {
                return res.status(404).json({ error: 'Entry not found' });
            }

            // Delete entry (cascading deletes will handle likes and comments)
            await prisma.entry.delete({
                where: { id },
            });

            res.json({
                message: 'Entry deleted successfully',
            });
        } catch (error) {
            console.error('Delete entry error:', error);
            res.status(500).json({ error: 'Failed to delete entry' });
        }
    }
);

// ============================================
// GET ENTRY STATISTICS
// ============================================
router.get('/stats/summary', authMiddleware, async (req: Request, res: Response): Promise<any> => {
    try {
        const userId = (req as any).user.userId;

        const [
            totalEntries,
            movieCount,
            tvShowCount,
            averageRating,
            totalWatchTime,
        ] = await Promise.all([
            prisma.entry.count({ where: { userId } }),
            prisma.entry.count({ where: { userId, type: 'MOVIE' } }),
            prisma.entry.count({ where: { userId, type: 'TV_SHOW' } }),
            prisma.entry.aggregate({
                where: { userId, rating: { not: null } },
                _avg: { rating: true },
            }),
            prisma.entry.count({ where: { userId } }), // Placeholder for watch time
        ]);

        res.json({
            stats: {
                totalEntries,
                movieCount,
                tvShowCount,
                episodeCount: totalEntries - movieCount - tvShowCount,
                averageRating: averageRating._avg.rating || 0,
                totalWatchTime, // This would need actual duration data
            },
        });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
});

export default router;
