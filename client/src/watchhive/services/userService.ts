import apiClient from './api';
import { User, UpdateUserData } from '../types';

export const userService = {
    async getMe(): Promise<User> {
        return apiClient.get<User>('/users/me');
    },

    async getUser(userId: string): Promise<User> {
        return apiClient.get<User>(`/users/${userId}`);
    },

    async updateUserData(data: UpdateUserData): Promise<User> {
        return apiClient.put<User>('/users/me', data);
    },

    async followUser(userId: string): Promise<void> {
        await apiClient.post(`/follows/${userId}`);
    },

    async unfollowUser(userId: string): Promise<void> {
        await apiClient.delete(`/follows/${userId}`);
    },

    async getFollowStatus(userId: string): Promise<{ isFollowing: boolean }> {
        return apiClient.get(`/follows/${userId}/status`);
    },

    async uploadAvatar(file: File): Promise<User> {
        const formData = new FormData();
        formData.append('avatar', file);
        return apiClient.post('/users/me/avatar', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },

    async deleteAvatar(): Promise<User> {
        return apiClient.delete<User>('/users/me/avatar');
    },

    async getFollowStats(userId: string): Promise<{ followersCount: number; followingCount: number }> {
        return apiClient.get(`/follows/stats/${userId}`);
    },

    async getFollowers(userId: string): Promise<User[]> {
        const response: any = await apiClient.get(`/follows/${userId}/followers`);
        return response.followers;
    },

    async getFollowing(userId: string): Promise<User[]> {
        const response: any = await apiClient.get(`/follows/${userId}/following`);
        return response.following;
    },

    async searchUsers(query: string): Promise<User[]> {
        const response: any = await apiClient.get(`/users/search?q=${encodeURIComponent(query)}`);
        return response.users || [];
    },
};

export default userService;
