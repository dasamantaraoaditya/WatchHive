import { Router, Request, Response } from 'express';
import { db } from '../db/index.js';
import { users, entries, follows } from '../db/schema.js';
import { eq, desc, sql, inArray } from 'drizzle-orm';
import { authMiddleware } from '../middleware/auth.middleware.js';
import tmdbService from '../services/tmdb.service.js';

const router = Router();

// ============================================
// GET /api/v1/feed
// Fetch mixed feed of user entries and system suggestions
// ============================================
router.get('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user.userId;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const offset = (page - 1) * limit;

        // 1. Get followed user IDs
        const followList = await db
            .select({ followingId: follows.followingId })
            .from(follows)
            .where(eq(follows.followerId, userId));

        const followedIds = followList.map(f => f.followingId);

        // Include self in the feed
        const relevantUserIds = [...followedIds, userId];

        // 2. Fetch Entries (Followed + Self)
        const rawEntries = await db.select({
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
            user: {
                id: users.id,
                username: users.username,
                displayName: users.displayName,
                profilePictureUrl: users.profilePictureUrl,
                isPrivate: users.isPrivate
            },
            likesCount: sql<number>`(SELECT count(*) FROM "Like" WHERE "Like"."entryId" = ${entries.id})`.mapWith(Number),
            commentsCount: sql<number>`(SELECT count(*) FROM "Comment" WHERE "Comment"."entryId" = ${entries.id})`.mapWith(Number),
            isLiked: sql<boolean>`EXISTS(SELECT 1 FROM "Like" WHERE "Like"."entryId" = ${entries.id} AND "Like"."userId" = ${userId})`
        })
            .from(entries)
            .innerJoin(users, eq(entries.userId, users.id))
            .where(inArray(entries.userId, relevantUserIds))
            .orderBy(desc(entries.createdAt))
            .limit(limit)
            .offset(offset);

        // Sort by "Trending Score" (Mix of Date & Engagement)
        // Note: Drizzle result already has counts mapped as properties
        const entriesWithScores = rawEntries.map(entry => {
            const likes = entry.likesCount || 0;
            const comments = entry.commentsCount || 0;
            const engagement = likes + (comments * 2);
            const hoursAge = Math.max(0.5, (Date.now() - new Date(entry.createdAt).getTime()) / (1000 * 60 * 60));
            const score = (engagement + 1) / Math.pow(hoursAge + 2, 1.5);
            return { entry, score };
        }).sort((a, b) => b.score - a.score).map(x => x.entry);

        // 3. Advanced Suggestions Generation
        let suggestions: any[] = [];

        try {
            // A. Fetch Most Recent User Entry for Contextual Suggestions
            const [lastEntry] = await db
                .select()
                .from(entries)
                .where(eq(entries.userId, userId))
                .orderBy(desc(entries.watchedAt))
                .limit(1);

            // C. Fetch TMDb Suggestions
            let tmdbRecs: any[] = [];

            if (lastEntry) {
                const recs = lastEntry.type === 'TV_SHOW'
                    ? await tmdbService.getTVShowRecommendations(lastEntry.tmdbId)
                    : await tmdbService.getMovieRecommendations(lastEntry.tmdbId);

                tmdbRecs = recs.results.map((r: any) => ({ ...r, reason: `Because you watched ${lastEntry.title}` }));
            }

            // Global trending
            const globalTrending = await tmdbService.getTrending('all', 'week');
            const trendingItems = globalTrending.results.map((r: any) => ({ ...r, reason: "Trending this week" }));

            suggestions = [...tmdbRecs.slice(0, 10), ...trendingItems.slice(0, 10)];

            // Randomize slightly
            suggestions.sort(() => Math.random() - 0.5);

        } catch (err) {
            console.error('Failed to fetch advanced suggestions', err);
            const fallback = await tmdbService.getTrending('all', 'week');
            suggestions = fallback.results.map((r: any) => ({ ...r, reason: "Trending Now" }));
        }

        // Pre-fetch user's watched IDs to mark items in feed
        const userEntriesList = await db
            .select({ tmdbId: entries.tmdbId })
            .from(entries)
            .where(eq(entries.userId, userId));

        const watchedTmdbIds = new Set(userEntriesList.map(e => e.tmdbId));

        // 4. Mix Content Strategy
        const feedItems: any[] = [];
        let suggestionIndex = (page - 1) * 2;

        const mappedEntries = entriesWithScores.map(entry => ({
            type: 'ENTRY',
            id: entry.id,
            timestamp: entry.createdAt,
            data: {
                ...entry,
                _count: { likes: entry.likesCount, comments: entry.commentsCount },
                isLiked: entry.isLiked,
                isWatched: watchedTmdbIds.has(entry.tmdbId)
            }
        }));

        if (mappedEntries.length === 0 && page === 1) {
            suggestions.slice(0, 15).forEach(item => {
                feedItems.push({
                    type: 'SUGGESTION',
                    id: `suggestion-${item.id}`,
                    timestamp: new Date(),
                    data: {
                        ...item,
                        isWatched: watchedTmdbIds.has(item.id)
                    },
                    reason: item.reason || "Trending on WatchHive"
                });
            });
        } else {
            for (let i = 0; i < mappedEntries.length; i++) {
                feedItems.push(mappedEntries[i]);

                if ((i + 1) % 3 === 0) {
                    const sugg = suggestions[suggestionIndex % suggestions.length];
                    if (sugg) {
                        feedItems.push({
                            type: 'SUGGESTION',
                            id: `suggestion-${sugg.id}-${page}-${i}`,
                            timestamp: mappedEntries[i].timestamp,
                            data: {
                                ...sugg,
                                isWatched: watchedTmdbIds.has(sugg.id)
                            },
                            reason: sugg.reason || "Trending Now"
                        });
                        suggestionIndex++;
                    }
                }
            }
        }

        res.json({
            items: feedItems,
            nextPage: rawEntries.length === limit ? page + 1 : null,
            hasMore: rawEntries.length === limit
        });

    } catch (error) {
        console.error('Feed error:', error);
        res.status(500).json({ error: 'Failed to fetch feed' });
    }
});

export default router;
