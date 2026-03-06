import dotenv from 'dotenv';

// Only load .env file in development — production platforms inject env vars directly
if (process.env.NODE_ENV !== 'production') {
    dotenv.config();
}

export const config = {
    port: process.env.PORT || 5001,
    nodeEnv: process.env.NODE_ENV || 'development',

    database: {
        url: process.env.DATABASE_URL!,
    },

    jwt: {
        secret: process.env.JWT_SECRET!,
        refreshSecret: process.env.JWT_REFRESH_SECRET!,
        expiresIn: process.env.JWT_EXPIRES_IN || '15m',
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    },

    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    },

    tmdb: {
        apiKey: process.env.TMDB_API_KEY!,
        baseUrl: process.env.TMDB_BASE_URL || 'https://api.themoviedb.org/3',
    },

    google: {
        clientId: process.env.GOOGLE_CLIENT_ID || '',
    },

    redis: {
        url: process.env.REDIS_URL || 'redis://localhost:6379',
    },

    email: {
        from: process.env.EMAIL_FROM || 'noreply@watchhive.com',
        sendgridApiKey: process.env.SENDGRID_API_KEY,
    },

    cloudinary: {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        apiKey: process.env.CLOUDINARY_API_KEY,
        apiSecret: process.env.CLOUDINARY_API_SECRET,
    },
};

// Validate required environment variables
const requiredEnvVars = [
    'DATABASE_URL',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
];

for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        throw new Error(`Missing required environment variable: ${envVar}`);
    }
}
