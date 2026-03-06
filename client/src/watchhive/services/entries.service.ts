import apiClient from './api.js';

// Entry types
export interface Entry {
    id: string;
    userId: string;
    tmdbId: number;
    title: string;
    type: 'MOVIE' | 'TV_SHOW' | 'EPISODE';
    watchedAt: string;
    rating: number | null;
    review: string | null;
    tags: string[];
    isRewatch: boolean;
    watchLocation: string | null;
    createdAt: string;
    updatedAt: string;
    user: {
        id: string;
        username: string;
        displayName: string | null;
        profilePictureUrl: string | null;
    };
    _count: {
        likes: number;
        comments: number;
    };
}

export interface CreateEntryData {
    tmdbId: number;
    title: string;
    type: 'MOVIE' | 'TV_SHOW' | 'EPISODE';
    watchedAt?: string;
    rating?: number;
    review?: string;
    tags?: string[];
    isRewatch?: boolean;
    watchLocation?: string;
}

export interface UpdateEntryData {
    title?: string;
    type?: 'MOVIE' | 'TV_SHOW' | 'EPISODE';
    watchedAt?: string;
    rating?: number;
    review?: string;
    tags?: string[];
    isRewatch?: boolean;
    watchLocation?: string;
}

export interface GetEntriesParams {
    userId?: string;
    type?: 'MOVIE' | 'TV_SHOW' | 'EPISODE';
    rating?: number;
    tag?: string;
    search?: string;
    limit?: number;
    offset?: number;
    sortBy?: 'watchedAt' | 'createdAt' | 'rating' | 'title';
    order?: 'asc' | 'desc';
}

export interface EntriesResponse {
    entries: Entry[];
    pagination: {
        total: number;
        limit: number;
        offset: number;
        hasMore: boolean;
    };
}

export interface EntryStats {
    totalEntries: number;
    movieCount: number;
    tvShowCount: number;
    episodeCount: number;
    averageRating: number;
    totalWatchTime: number;
}

// Entry API functions
export const entriesApi = {
    // Create a new entry
    createEntry: async (data: CreateEntryData): Promise<Entry> => {
        return await apiClient.post<Entry>('/entries', data);
    },

    // Get all entries with filters
    getEntries: async (params?: GetEntriesParams): Promise<EntriesResponse> => {
        return await apiClient.get<EntriesResponse>('/entries', { params });
    },

    // Get a single entry
    getEntry: async (id: string): Promise<Entry> => {
        return await apiClient.get<Entry>(`/entries/${id}`);
    },

    // Update an entry
    updateEntry: async (id: string, data: UpdateEntryData): Promise<Entry> => {
        return await apiClient.put<Entry>(`/entries/${id}`, data);
    },

    // Delete an entry
    deleteEntry: async (id: string): Promise<void> => {
        await apiClient.delete(`/entries/${id}`);
    },

    // Get entry statistics
    getStats: async (): Promise<EntryStats> => {
        return await apiClient.get<EntryStats>('/entries/stats/summary');
    },
};

export default entriesApi;
