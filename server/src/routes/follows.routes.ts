import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import prisma from '../utils/prisma.js';

const router = Router();

/**
 * @route   POST /api/follows/:userId
 * @desc    Follow a user
 * @access  Private
 */
router.post('/:userId', authMiddleware, async (req: Request, res: Response): Promise<void> => {
    try {
        const followingId = req.params.userId;
        const followerId = req.user!.userId;

        // Prevent self-follow
        if (followerId === followingId) {
            res.status(400).json({ error: 'You cannot follow yourself' });
            return;
        }

        // Check if user exists
        const userToFollow = await prisma.user.findUnique({
            where: { id: followingId },
        });

        if (!userToFollow) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        // Check if already following
        const existingFollow = await prisma.follow.findUnique({
            where: {
                followerId_followingId: {
                    followerId,
                    followingId,
                },
            },
        });

        if (existingFollow) {
            res.status(400).json({ error: 'You are already following this user' });
            return;
        }

        // Create follow relationship
        const follow = await prisma.follow.create({
            data: {
                followerId,
                followingId,
            },
            include: {
                following: {
                    select: {
                        id: true,
                        username: true,
                        email: true,
                        displayName: true,
                        profilePictureUrl: true,
                        createdAt: true,
                    },
                },
            },
        });

        res.status(201).json({
            message: 'Successfully followed user',
            follow,
        });
    } catch (error) {
        console.error('Error following user:', error);
        res.status(500).json({ error: 'Failed to follow user' });
    }
});

/**
 * @route   DELETE /api/follows/:userId
 * @desc    Unfollow a user
 * @access  Private
 */
router.delete('/:userId', authMiddleware, async (req: Request, res: Response): Promise<void> => {
    try {
        const followingId = req.params.userId;
        const followerId = req.user!.userId;

        // Check if follow relationship exists
        const existingFollow = await prisma.follow.findUnique({
            where: {
                followerId_followingId: {
                    followerId,
                    followingId,
                },
            },
        });

        if (!existingFollow) {
            res.status(404).json({ error: 'You are not following this user' });
            return;
        }

        // Delete follow relationship
        await prisma.follow.delete({
            where: {
                followerId_followingId: {
                    followerId,
                    followingId,
                },
            },
        });

        res.json({ message: 'Successfully unfollowed user' });
    } catch (error) {
        console.error('Error unfollowing user:', error);
        res.status(500).json({ error: 'Failed to unfollow user' });
    }
});

/**
 * @route   GET /api/follows/:userId/followers
 * @desc    Get list of followers for a user
 * @access  Private
 */
router.get('/:userId/followers', authMiddleware, async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.params.userId;
        const page = parseInt(req.query.page as string, 10) || 1;
        const limit = parseInt(req.query.limit as string, 10) || 20;
        const skip = (page - 1) * limit;

        // Get followers
        const [followers, total] = await Promise.all([
            prisma.follow.findMany({
                where: { followingId: userId },
                skip,
                take: limit,
                include: {
                    follower: {
                        select: {
                            id: true,
                            username: true,
                            email: true,
                            displayName: true,
                            profilePictureUrl: true,
                            createdAt: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: 'desc',
                },
            }),
            prisma.follow.count({
                where: { followingId: userId },
            }),
        ]);

        res.json({
            followers: followers.map((f) => f.follower),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Error getting followers:', error);
        res.status(500).json({ error: 'Failed to get followers' });
    }
});

/**
 * @route   GET /api/follows/:userId/following
 * @desc    Get list of users that a user is following
 * @access  Private
 */
router.get('/:userId/following', authMiddleware, async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.params.userId;
        const page = parseInt(req.query.page as string, 10) || 1;
        const limit = parseInt(req.query.limit as string, 10) || 20;
        const skip = (page - 1) * limit;

        // Get following
        const [following, total] = await Promise.all([
            prisma.follow.findMany({
                where: { followerId: userId },
                skip,
                take: limit,
                include: {
                    following: {
                        select: {
                            id: true,
                            username: true,
                            email: true,
                            displayName: true,
                            profilePictureUrl: true,
                            createdAt: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: 'desc',
                },
            }),
            prisma.follow.count({
                where: { followerId: userId },
            }),
        ]);

        res.json({
            following: following.map((f) => f.following),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Error getting following:', error);
        res.status(500).json({ error: 'Failed to get following' });
    }
});

/**
 * @route   GET /api/follows/:userId/status
 * @desc    Check if current user is following a specific user
 * @access  Private
 */
router.get('/:userId/status', authMiddleware, async (req: Request, res: Response): Promise<void> => {
    try {
        const followingId = req.params.userId;
        const followerId = req.user!.userId;

        // Check if following
        const follow = await prisma.follow.findUnique({
            where: {
                followerId_followingId: {
                    followerId,
                    followingId,
                },
            },
        });

        res.json({
            isFollowing: !!follow,
            followedAt: follow?.createdAt || null,
        });
    } catch (error) {
        console.error('Error checking follow status:', error);
        res.status(500).json({ error: 'Failed to check follow status' });
    }
});

/**
 * @route   GET /api/follows/stats/:userId
 * @desc    Get follower/following counts for a user
 * @access  Private
 */
router.get('/stats/:userId', authMiddleware, async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.params.userId;

        // Get counts
        const [followersCount, followingCount] = await Promise.all([
            prisma.follow.count({
                where: { followingId: userId },
            }),
            prisma.follow.count({
                where: { followerId: userId },
            }),
        ]);

        res.json({
            followersCount,
            followingCount,
        });
    } catch (error) {
        console.error('Error getting follow stats:', error);
        res.status(500).json({ error: 'Failed to get follow stats' });
    }
});

export default router;
