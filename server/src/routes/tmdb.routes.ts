import { Router, Request, Response } from 'express';
import tmdbService from '../services/tmdb.service.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

/**
 * @route   GET /api/tmdb/search/movie
 * @desc    Search for movies
 * @access  Private
 */
router.get('/search/movie', authMiddleware, async (req: Request, res: Response): Promise<void> => {
    try {
        const { query, page } = req.query;

        if (!query || typeof query !== 'string') {
            res.status(400).json({ error: 'Query parameter is required' });
            return;
        }

        const pageNum = page ? parseInt(page as string, 10) : 1;
        const results = await tmdbService.searchMovies(query, pageNum);

        res.json(results);
    } catch (error) {
        console.error('Error searching movies:', error);
        res.status(500).json({ error: 'Failed to search movies' });
    }
});

/**
 * @route   GET /api/tmdb/search/tv
 * @desc    Search for TV shows
 * @access  Private
 */
router.get('/search/tv', authMiddleware, async (req: Request, res: Response): Promise<void> => {
    try {
        const { query, page } = req.query;

        if (!query || typeof query !== 'string') {
            res.status(400).json({ error: 'Query parameter is required' });
            return;
        }

        const pageNum = page ? parseInt(page as string, 10) : 1;
        const results = await tmdbService.searchTVShows(query, pageNum);

        res.json(results);
    } catch (error) {
        console.error('Error searching TV shows:', error);
        res.status(500).json({ error: 'Failed to search TV shows' });
    }
});

/**
 * @route   GET /api/tmdb/search/multi
 * @desc    Search for both movies and TV shows
 * @access  Private
 */
router.get('/search/multi', authMiddleware, async (req: Request, res: Response): Promise<void> => {
    try {
        const { query, page } = req.query;

        if (!query || typeof query !== 'string') {
            res.status(400).json({ error: 'Query parameter is required' });
            return;
        }

        const pageNum = page ? parseInt(page as string, 10) : 1;
        const results = await tmdbService.searchMulti(query, pageNum);

        res.json(results);
    } catch (error) {
        console.error('Error searching:', error);
        res.status(500).json({ error: 'Failed to search' });
    }
});

/**
 * @route   GET /api/tmdb/movie/:id
 * @desc    Get movie details by TMDb ID
 * @access  Private
 */
router.get('/movie/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const movieId = parseInt(id, 10);

        if (isNaN(movieId)) {
            res.status(400).json({ error: 'Invalid movie ID' });
            return;
        }

        const movie = await tmdbService.getMovieDetails(movieId);
        res.json(movie);
    } catch (error) {
        console.error('Error getting movie details:', error);
        res.status(500).json({ error: 'Failed to get movie details' });
    }
});

/**
 * @route   GET /api/tmdb/tv/:id
 * @desc    Get TV show details by TMDb ID
 * @access  Private
 */
router.get('/tv/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const tvId = parseInt(id, 10);

        if (isNaN(tvId)) {
            res.status(400).json({ error: 'Invalid TV show ID' });
            return;
        }

        const tvShow = await tmdbService.getTVShowDetails(tvId);
        res.json(tvShow);
    } catch (error) {
        console.error('Error getting TV show details:', error);
        res.status(500).json({ error: 'Failed to get TV show details' });
    }
});

/**
 * @route   GET /api/tmdb/popular/movies
 * @desc    Get popular movies
 * @access  Private
 */
router.get('/popular/movies', authMiddleware, async (req: Request, res: Response): Promise<void> => {
    try {
        const { page } = req.query;
        const pageNum = page ? parseInt(page as string, 10) : 1;
        const results = await tmdbService.getPopularMovies(pageNum);

        res.json(results);
    } catch (error) {
        console.error('Error getting popular movies:', error);
        res.status(500).json({ error: 'Failed to get popular movies' });
    }
});

/**
 * @route   GET /api/tmdb/popular/tv
 * @desc    Get popular TV shows
 * @access  Private
 */
router.get('/popular/tv', authMiddleware, async (req: Request, res: Response): Promise<void> => {
    try {
        const { page } = req.query;
        const pageNum = page ? parseInt(page as string, 10) : 1;
        const results = await tmdbService.getPopularTVShows(pageNum);

        res.json(results);
    } catch (error) {
        console.error('Error getting popular TV shows:', error);
        res.status(500).json({ error: 'Failed to get popular TV shows' });
    }
});

/**
 * @route   GET /api/tmdb/trending/:mediaType/:timeWindow
 * @desc    Get trending movies/TV shows
 * @access  Private
 */
router.get('/trending/:mediaType/:timeWindow', authMiddleware, async (req: Request, res: Response): Promise<void> => {
    try {
        const { mediaType, timeWindow } = req.params;

        if (!['movie', 'tv', 'all'].includes(mediaType)) {
            res.status(400).json({ error: 'Invalid media type. Must be movie, tv, or all' });
            return;
        }

        if (!['day', 'week'].includes(timeWindow)) {
            res.status(400).json({ error: 'Invalid time window. Must be day or week' });
            return;
        }

        const results = await tmdbService.getTrending(
            mediaType as 'movie' | 'tv' | 'all',
            timeWindow as 'day' | 'week'
        );

        res.json(results);
    } catch (error) {
        console.error('Error getting trending:', error);
        res.status(500).json({ error: 'Failed to get trending' });
    }
});

export default router;
