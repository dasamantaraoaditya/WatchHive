import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { eq, or } from 'drizzle-orm';
import { hashPassword, comparePassword } from '../utils/bcrypt.util.js';
import {
    generateAccessToken,
    generateRefreshToken,
    verifyRefreshToken,
} from '../utils/jwt.util.js';
import { AppError } from '../middleware/error.middleware.js';

export interface RegisterData {
    username: string;
    email: string;
    password: string;
    displayName?: string;
}

export interface LoginData {
    email: string;
    password: string;
}

export interface AuthResponse {
    user: {
        id: string;
        username: string;
        email: string;
        displayName: string | null;
        profilePictureUrl: string | null;
    };
    accessToken: string;
    refreshToken: string;
}

export const authService = {
    async register(data: RegisterData): Promise<AuthResponse> {
        // Check if user already exists
        const [existingUser] = await db
            .select()
            .from(users)
            .where(or(eq(users.email, data.email), eq(users.username, data.username)))
            .limit(1);

        if (existingUser) {
            if (existingUser.email === data.email) {
                throw new AppError('Email already in use', 400);
            }
            throw new AppError('Username already taken', 400);
        }

        // Hash password
        const passwordHash = await hashPassword(data.password);

        // Create user
        const [user] = await db
            .insert(users)
            .values({
                username: data.username,
                email: data.email,
                passwordHash,
                displayName: data.displayName || data.username,
            })
            .returning({
                id: users.id,
                username: users.username,
                email: users.email,
                displayName: users.displayName,
                profilePictureUrl: users.profilePictureUrl,
            });

        // Generate tokens
        const accessToken = generateAccessToken({
            userId: user.id,
            email: user.email,
        });
        const refreshToken = generateRefreshToken({
            userId: user.id,
            email: user.email,
        });

        return {
            user,
            accessToken,
            refreshToken,
        };
    },

    async login(data: LoginData): Promise<AuthResponse> {
        // Find user
        const [user] = await db
            .select({
                id: users.id,
                username: users.username,
                email: users.email,
                displayName: users.displayName,
                profilePictureUrl: users.profilePictureUrl,
                passwordHash: users.passwordHash,
            })
            .from(users)
            .where(eq(users.email, data.email))
            .limit(1);

        if (!user) {
            throw new AppError('Invalid email or password', 401);
        }

        // If user has no password (Google-only account), suggest Google login
        if (!user.passwordHash) {
            throw new AppError('This account uses Google Sign-In. Please sign in with Google.', 400);
        }

        // Verify password
        const isPasswordValid = await comparePassword(
            data.password,
            user.passwordHash
        );

        if (!isPasswordValid) {
            throw new AppError('Invalid email or password', 401);
        }

        // Generate tokens
        const accessToken = generateAccessToken({
            userId: user.id,
            email: user.email,
        });
        const refreshToken = generateRefreshToken({
            userId: user.id,
            email: user.email,
        });

        // Remove password hash from response
        const { passwordHash, ...userWithoutPassword } = user;

        return {
            user: userWithoutPassword,
            accessToken,
            refreshToken,
        };
    },

    async refresh(token: string): Promise<{ accessToken: string; refreshToken: string }> {
        try {
            const payload = verifyRefreshToken(token);

            // Verify user still exists
            const [user] = await db
                .select()
                .from(users)
                .where(eq(users.id, payload.userId))
                .limit(1);

            if (!user) {
                throw new AppError('User not found', 404);
            }

            // Generate new tokens
            const accessToken = generateAccessToken({
                userId: user.id,
                email: user.email,
            });
            const refreshToken = generateRefreshToken({
                userId: user.id,
                email: user.email,
            });

            return {
                accessToken,
                refreshToken,
            };
        } catch (error) {
            throw new AppError('Invalid refresh token', 401);
        }
    },
};
