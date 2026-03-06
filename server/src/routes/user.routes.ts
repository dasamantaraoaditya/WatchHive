import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import { authMiddleware } from '../middleware/auth.middleware.js';

import { db } from '../db/index.js';
import { users, follows, entries } from '../db/schema.js';
import { eq, or, and, ilike, not, count, exists } from 'drizzle-orm';
import { AppError } from '../middleware/error.middleware.js';

import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import multerS3 from 'multer-s3';

const router = Router();

// Configure S3 client
const s3 = new S3Client({
    region: process.env.AWS_S3_REGION || 'us-west-2',
});

// Configure multer for S3 uploads
const upload = multer({
    storage: multerS3({
        s3: s3,
        bucket: process.env.S3_BUCKET_NAME || 'watchhive-uploads-prod-api-us-west-2',
        acl: 'public-read',
        contentType: multerS3.AUTO_CONTENT_TYPE,
        key: (req, _file, cb) => {
            const userId = req.user?.userId || 'unknown';
            const ext = path.extname(_file.originalname) || '.jpg';
            const filename = `avatars/${userId}-${Date.now()}${ext}`;
            cb(null, filename);
        },
    }),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5 MB
    },
    fileFilter: (_req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new AppError('Only JPEG, PNG, WebP, and GIF images are allowed', 400) as any);
        }
    },
});


// GET /api/v1/users/me - Get current user profile
router.get('/me', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.userId;

        const [user] = await db
            .select({
                id: users.id,
                username: users.username,
                email: users.email,
                displayName: users.displayName,
                bio: users.bio,
                profilePictureUrl: users.profilePictureUrl,
                location: users.location,
                isPrivate: users.isPrivate,
                createdAt: users.createdAt,
                updatedAt: users.updatedAt,
            })
            .from(users)
            .where(eq(users.id, userId))
            .limit(1);

        if (!user) {
            throw new AppError('User not found', 404);
        }

        res.json(user);
    } catch (error) {
        next(error);
    }
});

// PUT /api/v1/users/me - Update current user profile
router.put('/me', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.userId;
        const { displayName, bio, location } = req.body;

        const [user] = await db
            .update(users)
            .set({
                ...(displayName !== undefined && { displayName }),
                ...(bio !== undefined && { bio }),
                ...(location !== undefined && { location }),
                updatedAt: new Date(),
            })
            .where(eq(users.id, userId))
            .returning({
                id: users.id,
                username: users.username,
                email: users.email,
                displayName: users.displayName,
                bio: users.bio,
                profilePictureUrl: users.profilePictureUrl,
                location: users.location,
                isPrivate: users.isPrivate,
                createdAt: users.createdAt,
                updatedAt: users.updatedAt,
            });

        res.json(user);
    } catch (error) {
        next(error);
    }
});

// POST /api/v1/users/me/avatar - Upload profile picture
router.post(
    '/me/avatar',
    authMiddleware,
    upload.single('avatar'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.user!.userId;

            if (!req.file) {
                throw new AppError('No file uploaded', 400);
            }

            // Delete old avatar file if it exists
            const [currentUser] = await db
                .select({ profilePictureUrl: users.profilePictureUrl })
                .from(users)
                .where(eq(users.id, userId))
                .limit(1);

            if (currentUser?.profilePictureUrl && currentUser.profilePictureUrl.includes('.amazonaws.com/')) {
                const key = currentUser.profilePictureUrl.split('.amazonaws.com/').pop();
                if (key) {
                    try {
                        await s3.send(new DeleteObjectCommand({
                            Bucket: process.env.S3_BUCKET_NAME || 'watchhive-uploads-prod-api-us-west-2',
                            Key: key,
                        }));
                    } catch (err) {
                        console.error('Error deleting old avatar from S3:', err);
                    }
                }
            }

            // Build the URL for the uploaded file
            const profilePictureUrl = (req.file as any).location;

            // Update user in database
            const [user] = await db
                .update(users)
                .set({ profilePictureUrl, updatedAt: new Date() })
                .where(eq(users.id, userId))
                .returning({
                    id: users.id,
                    username: users.username,
                    email: users.email,
                    displayName: users.displayName,
                    bio: users.bio,
                    profilePictureUrl: users.profilePictureUrl,
                    location: users.location,
                });

            res.json(user);
        } catch (error) {
            next(error);
        }
    }
);

// DELETE /api/v1/users/me/avatar - Remove profile picture
router.delete('/me/avatar', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.userId;

        // Get current avatar to delete file
        const [currentUser] = await db
            .select({ profilePictureUrl: users.profilePictureUrl })
            .from(users)
            .where(eq(users.id, userId))
            .limit(1);

        if (currentUser?.profilePictureUrl && currentUser.profilePictureUrl.includes('.amazonaws.com/')) {
            const key = currentUser.profilePictureUrl.split('.amazonaws.com/').pop();
            if (key) {
                try {
                    await s3.send(new DeleteObjectCommand({
                        Bucket: process.env.S3_BUCKET_NAME || 'watchhive-uploads-prod-api-us-west-2',
                        Key: key,
                    }));
                } catch (err) {
                    console.error('Error deleting avatar from S3:', err);
                }
            }
        }

        // Clear profilePictureUrl in database
        const [user] = await db
            .update(users)
            .set({ profilePictureUrl: null, updatedAt: new Date() })
            .where(eq(users.id, userId))
            .returning({
                id: users.id,
                username: users.username,
                email: users.email,
                displayName: users.displayName,
                bio: users.bio,
                profilePictureUrl: users.profilePictureUrl,
                location: users.location,
            });

        res.json(user);
    } catch (error) {
        next(error);
    }
});


// GET /api/v1/users/search - Search for users
router.get('/search', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const query = req.query.q as string;
        const page = parseInt(req.query.page as string, 10) || 1;
        const limit = parseInt(req.query.limit as string, 10) || 20;

        if (!query || query.trim().length === 0) {
            res.json({ users: [], pagination: { page, limit, total: 0, totalPages: 0 } });
            return;
        }

        const offset = (page - 1) * limit;
        const currentId = req.user!.userId;

        const whereClause = and(
            or(
                ilike(users.username, `%${query}%`),
                ilike(users.displayName, `%${query}%`)
            ),
            not(eq(users.id, currentId))
        );

        const [usersList, [{ total }]] = await Promise.all([
            db.select({
                id: users.id,
                username: users.username,
                displayName: users.displayName,
                profilePictureUrl: users.profilePictureUrl,
                isPrivate: users.isPrivate,
                isFollowing: exists(
                    db.select()
                        .from(follows)
                        .where(and(eq(follows.followerId, currentId), eq(follows.followingId, users.id)))
                )
            })
                .from(users)
                .where(whereClause)
                .limit(limit)
                .offset(offset),
            db.select({ total: count() }).from(users).where(whereClause)
        ]);

        res.json({
            users: usersList,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        next(error);
    }
});

// GET /api/v1/users/:id - Get specific user profile
router.get('/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const targetId = req.params.id;
        const currentId = req.user!.userId;

        // Fetch user basic info
        const [user] = await db
            .select({
                id: users.id,
                username: users.username,
                displayName: users.displayName,
                bio: users.bio,
                profilePictureUrl: users.profilePictureUrl,
                location: users.location,
                isPrivate: users.isPrivate,
                createdAt: users.createdAt,
            })
            .from(users)
            .where(eq(users.id, targetId))
            .limit(1);

        if (!user) {
            throw new AppError('User not found', 404);
        }

        // Fetch stats in parallel
        const [
            [{ followersCount }],
            [{ followingCount }],
            [{ entriesCount }],
            [followStatus]
        ] = await Promise.all([
            db.select({ followersCount: count() }).from(follows).where(eq(follows.followingId, targetId)),
            db.select({ followingCount: count() }).from(follows).where(eq(follows.followerId, targetId)),
            db.select({ entriesCount: count() }).from(entries).where(eq(entries.userId, targetId)),
            db.select().from(follows).where(and(eq(follows.followerId, currentId), eq(follows.followingId, targetId))).limit(1)
        ]);

        res.json({
            ...user,
            _count: {
                followers: followersCount,
                following: followingCount,
                entries: entriesCount
            },
            isFollowing: !!followStatus,
        });
    } catch (error) {
        next(error);
    }
});

export default router;
