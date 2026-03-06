import { Router, Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { db } from '../db/index.js';
import { users, entries, follows, likes, comments } from '../db/schema.js';
import { eq, and, desc, asc, count, sql, ilike, or, arrayContains, avg } from 'drizzle-orm';
import { authMiddleware } from '../middleware/auth.middleware.js';
import tmdbService from '../services/tmdb.service.js';

const router = Router();

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

            let entryTags: string[] = Array.isArray(tags) ? [...tags] : [];

            if (tmdbId) {
                try {
                    let genres: string[] = [];
                    if (type === 'MOVIE') {
                        const details = await tmdbService.getMovieDetails(tmdbId);
                        genres = details.genres.map(g => g.name);
                    } else if (type === 'TV_SHOW') {
                        const details = await tmdbService.getTVShowDetails(tmdbId);
                        genres = details.genres.map(g => g.name);
                    }
                    // Merge and deduplicate
                    entryTags = Array.from(new Set([...entryTags, ...genres]));
                } catch (tmdbError) {
                    console.error('Failed to auto-fetch genres', tmdbError);
                }
            }

            // Create entry
            const [newEntry] = await db.insert(entries).values({
                userId,
                tmdbId,
                title,
                type: type as any,
                watchedAt: watchedAt ? new Date(watchedAt) : new Date(),
                rating: rating ? rating.toString() : null,
                review: review || null,
                tags: entryTags,
                isRewatch: isRewatch || false,
                watchLocation: watchLocation || null,
            }).returning();

            // Fetch fully populated entry for response
            const entry = await db.query.entries.findFirst({
                where: eq(entries.id, newEntry.id),
                with: {
                    user: {
                        columns: {
                            id: true,
                            username: true,
                            displayName: true,
                            profilePictureUrl: true,
                        }
                    }
                }
            });

            // Need to manually add counts due to Drizzle _count limitation in findFirst
            const [[{ likesCount }], [{ commentsCount }]] = await Promise.all([
                db.select({ likesCount: count() }).from(likes).where(eq(likes.entryId, newEntry.id)),
                db.select({ commentsCount: count() }).from(comments).where(eq(comments.entryId, newEntry.id))
            ]);

            res.status(201).json({
                message: 'Entry created successfully',
                entry: {
                    ...entry,
                    _count: { likes: likesCount, comments: commentsCount }
                },
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
        const currentUserId = (req as any).user.userId;
        const {
            type,
            rating,
            tag,
            search,
            limit = '20',
            offset = '0',
            sortBy = 'watchedAt',
            order = 'desc',
            userId: queryUserId,
        } = req.query;

        let targetUserId = currentUserId;

        // If querying another user, check privacy permissions
        if (queryUserId && queryUserId !== currentUserId) {
            targetUserId = queryUserId as string;

            const [targetUser] = await db
                .select({ isPrivate: users.isPrivate })
                .from(users)
                .where(eq(users.id, targetUserId))
                .limit(1);

            if (!targetUser) {
                return res.status(404).json({ error: 'User not found' });
            }

            if (targetUser.isPrivate) {
                const [isFollowing] = await db
                    .select()
                    .from(follows)
                    .where(and(eq(follows.followerId, currentUserId), eq(follows.followingId, targetUserId)))
                    .limit(1);

                if (!isFollowing) {
                    return res.status(403).json({ error: 'This account is private. Follow to see entries.' });
                }
            }
        }

        // Build filter conditions
        const conditions: any[] = [eq(entries.userId, targetUserId)];

        if (type) conditions.push(eq(entries.type, type as any));
        if (rating) conditions.push(eq(entries.rating, rating.toString()));
        if (tag) conditions.push(arrayContains(entries.tags, [tag as string]));
        if (search) {
            conditions.push(or(
                ilike(entries.title, `%${search}%`),
                ilike(entries.review, `%${search}%`)
            ));
        }

        const whereClause = conditions.length > 1 ? and(...conditions) : conditions[0];

        // Get entries with pagination and manual counts
        const [entriesList, [{ total }]] = await Promise.all([
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
                    profilePictureUrl: users.profilePictureUrl
                },
                likesCount: sql<number>`(SELECT count(*) FROM "Like" WHERE "Like"."entryId" = ${entries.id})`.mapWith(Number),
                commentsCount: sql<number>`(SELECT count(*) FROM "Comment" WHERE "Comment"."entryId" = ${entries.id})`.mapWith(Number)
            })
                .from(entries)
                .innerJoin(users, eq(entries.userId, users.id))
                .where(whereClause)
                .orderBy(order === 'asc' ? asc(entries[sortBy as keyof typeof entries] as any) : desc(entries[sortBy as keyof typeof entries] as any))
                .limit(parseInt(limit as string))
                .offset(parseInt(offset as string)),
            db.select({ total: count() }).from(entries).where(whereClause)
        ]);

        // Map Drizzle result to Prisma-like structure for frontend compatibility
        const formattedEntries = entriesList.map(e => ({
            ...e,
            _count: { likes: e.likesCount, comments: e.commentsCount }
        }));

        res.json({
            entries: formattedEntries,
            pagination: {
                total,
                limit: parseInt(limit as string),
                offset: parseInt(offset as string),
                hasMore: parseInt(offset as string) + entriesList.length < total,
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

            const entry = await db.query.entries.findFirst({
                where: and(eq(entries.id, id), eq(entries.userId, userId)),
                with: {
                    user: {
                        columns: {
                            id: true,
                            username: true,
                            displayName: true,
                            profilePictureUrl: true,
                        }
                    },
                    likes: {
                        columns: {
                            userId: true
                        }
                    },
                    comments: {
                        orderBy: desc(comments.createdAt),
                        with: {
                            user: {
                                columns: {
                                    id: true,
                                    username: true,
                                    displayName: true,
                                    profilePictureUrl: true,
                                }
                            }
                        }
                    }
                }
            });

            if (!entry) {
                return res.status(404).json({ error: 'Entry not found' });
            }

            // Manually add counts
            const [[{ likesCount }], [{ commentsCount }]] = await Promise.all([
                db.select({ likesCount: count() }).from(likes).where(eq(likes.entryId, id)),
                db.select({ commentsCount: count() }).from(comments).where(eq(comments.entryId, id))
            ]);

            res.json({
                entry: {
                    ...entry,
                    _count: { likes: likesCount, comments: commentsCount }
                }
            });
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
            const [existingEntry] = await db
                .select()
                .from(entries)
                .where(and(eq(entries.id, id), eq(entries.userId, userId)))
                .limit(1);

            if (!existingEntry) {
                return res.status(404).json({ error: 'Entry not found' });
            }

            // Update entry
            const updateData = { ...req.body };
            if (updateData.watchedAt) updateData.watchedAt = new Date(updateData.watchedAt);
            if (updateData.rating) updateData.rating = updateData.rating.toString();

            await db
                .update(entries)
                .set({ ...updateData, updatedAt: new Date() })
                .where(eq(entries.id, id));

            // Fetch fully populated updated entry
            const entry = await db.query.entries.findFirst({
                where: eq(entries.id, id),
                with: {
                    user: {
                        columns: {
                            id: true,
                            username: true,
                            displayName: true,
                            profilePictureUrl: true,
                        }
                    }
                }
            });

            const [[{ likesCount }], [{ commentsCount }]] = await Promise.all([
                db.select({ likesCount: count() }).from(likes).where(eq(likes.entryId, id)),
                db.select({ commentsCount: count() }).from(comments).where(eq(comments.entryId, id))
            ]);

            res.json({
                message: 'Entry updated successfully',
                entry: {
                    ...entry,
                    _count: { likes: likesCount, comments: commentsCount }
                },
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
            const [existingEntry] = await db
                .select()
                .from(entries)
                .where(and(eq(entries.id, id), eq(entries.userId, userId)))
                .limit(1);

            if (!existingEntry) {
                return res.status(404).json({ error: 'Entry not found' });
            }

            // Delete entry (cascading deletes handled by DB)
            await db.delete(entries).where(eq(entries.id, id));

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
            [{ totalEntries }],
            [{ movieCount }],
            [{ tvShowCount }],
            [{ avgRating }],
            [{ totalWatchTime }] // Still placeholder
        ] = await Promise.all([
            db.select({ totalEntries: count() }).from(entries).where(eq(entries.userId, userId)),
            db.select({ movieCount: count() }).from(entries).where(and(eq(entries.userId, userId), eq(entries.type, 'MOVIE' as any))),
            db.select({ tvShowCount: count() }).from(entries).where(and(eq(entries.userId, userId), eq(entries.type, 'TV_SHOW' as any))),
            db.select({ avgRating: avg(entries.rating) }).from(entries).where(eq(entries.userId, userId)),
            db.select({ totalWatchTime: count() }).from(entries).where(eq(entries.userId, userId)),
        ]);

        res.json({
            stats: {
                totalEntries,
                movieCount,
                tvShowCount,
                episodeCount: (totalEntries || 0) - (movieCount || 0) - (tvShowCount || 0),
                averageRating: parseFloat((avgRating as any) || 0),
                totalWatchTime,
            },
        });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
});

export default router;
