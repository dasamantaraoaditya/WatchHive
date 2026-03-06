import apiClient from './api.js';

export interface ListItem {
    id: string;
    listId: string;
    tmdbId: number;
    mediaType?: string;
    orderIndex: number;
    addedAt: string;
}

export interface List {
    id: string;
    userId: string;
    name: string;
    description?: string;
    isPublic: boolean;
    createdAt: string;
    updatedAt: string;
    items: ListItem[];
}

export const listsApi = {
    getWatchlist: async (): Promise<List> => {
        return await apiClient.get<List>('/lists/watchlist');
    },

    addToWatchlist: async (listId: string, tmdbId: number, mediaType: 'movie' | 'tv' = 'movie'): Promise<ListItem> => {
        return await apiClient.post<ListItem>(`/lists/${listId}/items`, { tmdbId, mediaType });
    },

    removeFromWatchlist: async (listId: string, tmdbId: number): Promise<void> => {
        await apiClient.delete(`/lists/${listId}/items/${tmdbId}`);
    },
};

export default listsApi;
