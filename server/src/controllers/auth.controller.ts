import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service.js';

export const authController = {
    async register(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { username, email, password, displayName } = req.body;

            const result = await authService.register({
                username,
                email,
                password,
                displayName,
            });

            res.status(201).json(result);
        } catch (error) {
            next(error);
        }
    },

    async login(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { email, password } = req.body;

            const result = await authService.login({ email, password });

            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    },

    async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { refreshToken } = req.body;

            if (!refreshToken) {
                res.status(400).json({ error: 'Refresh token is required' });
                return;
            }

            const result = await authService.refresh(refreshToken);

            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    },

    async logout(_req: Request, res: Response): Promise<void> {
        // For JWT, logout is handled client-side by removing tokens
        // In future, we could implement token blacklisting with Redis
        res.status(200).json({ message: 'Logged out successfully' });
    },
};
