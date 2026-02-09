import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config.js';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';
import authRoutes from './routes/auth.routes.js';
import entriesRoutes from './routes/entries.js';
import tmdbRoutes from './routes/tmdb.routes.js';
import followsRoutes from './routes/follows.routes.js';
import likesRoutes from './routes/likes.routes.js';

const app = express();

// Security middleware
app.use(helmet());

// CORS
app.use(
    cors({
        origin: config.cors.origin,
        credentials: true,
    })
);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
if (config.nodeEnv === 'development') {
    app.use(morgan('dev'));
}

// Health check
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', environment: config.nodeEnv });
});

// API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/entries', entriesRoutes);
app.use('/api/v1/tmdb', tmdbRoutes);
app.use('/api/v1/follows', followsRoutes);
app.use('/api/v1/likes', likesRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

export default app;
