import jwt from 'jsonwebtoken';
import { config } from '../config.js';

export interface JWTPayload {
    userId: string;
    email: string;
}

export const generateAccessToken = (payload: JWTPayload): string => {
    return jwt.sign(payload, config.jwt.secret, {
        expiresIn: config.jwt.expiresIn as any,
    });
};

export const generateRefreshToken = (payload: JWTPayload): string => {
    return jwt.sign(payload, config.jwt.refreshSecret, {
        expiresIn: config.jwt.refreshExpiresIn as any,
    });
};

export const verifyAccessToken = (token: string): JWTPayload => {
    try {
        return jwt.verify(token, config.jwt.secret) as JWTPayload;
    } catch (error) {
        throw new Error('Invalid or expired access token');
    }
};

export const verifyRefreshToken = (token: string): JWTPayload => {
    try {
        return jwt.verify(token, config.jwt.refreshSecret) as JWTPayload;
    } catch (error) {
        throw new Error('Invalid or expired refresh token');
    }
};
