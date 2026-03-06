import { Router, Request, Response } from 'express';
import { db } from '../db/index.js';
import { lists, listItems } from '../db/schema.js';
import { eq, and, desc } from 'drizzle-orm';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

// Get (or create) the default "Watchlist"
router.get('/watchlist', authMiddleware, async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user!.userId;

        // Try to find a list named "Watchlist" for this user
        let watchlist = await db.query.lists.findFirst({
            where: and(eq(lists.userId, userId), eq(lists.name, 'Watchlist')),
            with: {
                items: {
                    orderBy: desc(listItems.addedAt),
                },
            },
        });

        // If not found, create it
        if (!watchlist) {
            const [newList] = await db
                .insert(lists)
                .values({
                    userId,
                    name: 'Watchlist',
                    description: 'Movies and shows I plan to watch',
                    isPublic: true,
                })
                .returning();

            // Return with empty items for consistency
            watchlist = { ...newList, items: [] } as any;
        }

        res.json(watchlist);
    } catch (error) {
        console.error('Error fetching watchlist:', error);
        res.status(500).json({ error: 'Failed to fetch watchlist' });
    }
});

// Add item to a list
router.post('/:listId/items', authMiddleware, async (req: Request, res: Response): Promise<void> => {
    try {
        const { listId } = req.params;
        const { tmdbId, mediaType } = req.body;
        const userId = req.user!.userId;

        // Verify list ownership
        const [list] = await db
            .select()
            .from(lists)
            .where(eq(lists.id, listId))
            .limit(1);

        if (!list) {
            res.status(404).json({ error: 'List not found' });
            return;
        }

        if (list.userId !== userId) {
            res.status(403).json({ error: 'Unauthorized' });
            return;
        }

        // Check if item already exists
        const [existing] = await db
            .select()
            .from(listItems)
            .where(
                and(
                    eq(listItems.listId, listId),
                    eq(listItems.tmdbId, Number(tmdbId)),
                    eq(listItems.mediaType, mediaType || 'movie')
                )
            )
            .limit(1);

        if (existing) {
            res.status(400).json({ error: 'Item already in list' });
            return;
        }

        // Get max order index
        const [lastItem] = await db
            .select({ orderIndex: listItems.orderIndex })
            .from(listItems)
            .where(eq(listItems.listId, listId))
            .orderBy(desc(listItems.orderIndex))
            .limit(1);

        const [newItem] = await db
            .insert(listItems)
            .values({
                listId,
                tmdbId: Number(tmdbId),
                mediaType: mediaType || 'movie',
                orderIndex: lastItem ? lastItem.orderIndex + 1 : 0,
            })
            .returning();

        res.json(newItem);
    } catch (error) {
        console.error('Error adding to list:', error);
        res.status(500).json({ error: 'Failed to add item to list' });
    }
});

// Remove item from a list (by tmdbId for convenience)
router.delete('/:listId/items/:tmdbId', authMiddleware, async (req: Request, res: Response): Promise<void> => {
    try {
        const { listId, tmdbId } = req.params;
        const userId = req.user!.userId;

        const [list] = await db
            .select()
            .from(lists)
            .where(eq(lists.id, listId))
            .limit(1);

        if (!list || list.userId !== userId) {
            res.status(403).json({ error: 'Unauthorized' });
            return;
        }

        // Find and delete the item by tmdbId
        const result = await db
            .delete(listItems)
            .where(
                and(
                    eq(listItems.listId, listId),
                    eq(listItems.tmdbId, Number(tmdbId))
                )
            )
            .returning();

        if (result.length === 0) {
            res.status(404).json({ error: 'Item not found in list' });
            return;
        }

        res.json({ message: 'Removed' });
    } catch (error) {
        console.error('Error removing from list:', error);
        res.status(500).json({ error: 'Failed to remove' });
    }
});

export default router;
