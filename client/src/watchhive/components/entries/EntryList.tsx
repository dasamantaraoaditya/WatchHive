import React, { useState, useEffect, useCallback } from 'react';
import { entriesApi, Entry, GetEntriesParams } from '../../services/entries.service';
import apiClient from '../../services/api.js';
import { MovieCardSkeleton, ErrorState, EmptyState, Button, WatchlistButton } from '../common';
import './EntryList.css';

interface EntryListProps {
    onEdit?: (entry: Entry) => void;
    filters?: GetEntriesParams;
    readOnly?: boolean;
}

/* ── TMDb detail cache ── */
interface TmdbDetails {
    poster_path: string | null;
    overview: string;
    vote_average: number;
    genres: string[];
    runtime?: number | null;
    release_date?: string;
    first_air_date?: string;
    number_of_seasons?: number;
    tagline?: string;
}

const tmdbCache = new Map<string, TmdbDetails>();

/* ── Inline star display (read-only) ── */
const MiniStars: React.FC<{ rating: number }> = ({ rating }) => {
    return (
        <div className="wh-grid-stars" title={`${rating}/10`}>
            {[1, 2, 3, 4, 5].map((star) => {
                const starValue = star * 2;
                const filled = rating >= starValue;
                const half = !filled && rating >= starValue - 1;
                return (
                    <svg key={star} viewBox="0 0 24 24" className="wh-grid-star-icon">
                        <path
                            className={`wh-grid-star-path ${filled ? 'wh-grid-star--filled' : ''}`}
                            d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                        />
                        {half && (
                            <path
                                className="wh-grid-star--half"
                                d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77V2z"
                                transform="scale(-1,1) translate(-24,0)"
                            />
                        )}
                    </svg>
                );
            })}
        </div>
    );
};

/* ── Single Grid Card ── */
const EntryCard: React.FC<{
    entry: Entry;
    onEdit?: (entry: Entry) => void;
    onDelete?: (id: string) => void;
}> = ({ entry, onEdit, onDelete }) => {
    const [details, setDetails] = useState<TmdbDetails | null>(null);
    const [imgError, setImgError] = useState(false);

    const cacheKey = `${entry.type}-${entry.tmdbId}`;

    useEffect(() => {
        if (tmdbCache.has(cacheKey)) {
            setDetails(tmdbCache.get(cacheKey)!);
            return;
        }

        const fetchDetails = async () => {
            try {
                const endpoint = entry.type === 'TV_SHOW' ? 'tv' : 'movie';
                const data: any = await apiClient.get(`/tmdb/${endpoint}/${entry.tmdbId}`);
                const parsed: TmdbDetails = {
                    poster_path: data.poster_path,
                    overview: data.overview || '',
                    vote_average: data.vote_average || 0,
                    genres: (data.genres || []).map((g: any) => g.name),
                    runtime: data.runtime || null,
                    release_date: data.release_date,
                    first_air_date: data.first_air_date,
                    number_of_seasons: data.number_of_seasons,
                    tagline: data.tagline || '',
                };
                tmdbCache.set(cacheKey, parsed);
                setDetails(parsed);
            } catch {
                // Silently fail — card still works without poster
            }
        };
        fetchDetails();
    }, [cacheKey, entry.tmdbId, entry.type]);

    const posterUrl = details?.poster_path
        ? `https://image.tmdb.org/t/p/w342${details.poster_path}`
        : null;

    const getTypeInfo = (type: string) => {
        switch (type) {
            case 'MOVIE': return { emoji: '🎬', label: 'Movie', cls: 'movie' };
            case 'TV_SHOW': return { emoji: '📺', label: 'TV Series', cls: 'tv_show' };
            case 'EPISODE': return { emoji: '📼', label: 'Episode', cls: 'episode' };
            default: return { emoji: '', label: type, cls: '' };
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const ti = getTypeInfo(entry.type);
    const year = details?.release_date?.slice(0, 4) || details?.first_air_date?.slice(0, 4);
    const tmdbRating = details?.vote_average;

    return (
        <div className="wh-grid-card">
            {/* Poster area */}
            <div className="wh-grid-card__poster">
                {posterUrl && !imgError ? (
                    <img
                        src={posterUrl}
                        alt={entry.title}
                        className="wh-grid-card__img"
                        loading="lazy"
                        onError={() => setImgError(true)}
                    />
                ) : (
                    <div className="wh-grid-card__poster-placeholder">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                            <path d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                        </svg>
                    </div>
                )}

                {/* Hover overlay with actions */}
                <div className="wh-grid-card__overlay">
                    <div className="wh-grid-card__overlay-actions">
                        <WatchlistButton tmdbId={entry.tmdbId} variant="icon" className="wh-grid-card__action-btn" />
                        {onEdit && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onEdit(entry); }}
                                className="wh-grid-card__action-btn wh-grid-card__action-btn--edit"
                                title="Edit entry"
                            >
                                <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                </svg>
                            </button>
                        )}
                        {onDelete && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onDelete(entry.id); }}
                                className="wh-grid-card__action-btn wh-grid-card__action-btn--delete"
                                title="Delete entry"
                            >
                                <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                            </button>
                        )}
                    </div>

                    {/* TMDb rating badge on overlay */}
                    {tmdbRating != null && tmdbRating > 0 && (
                        <div className="wh-grid-card__tmdb-badge">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="#fbbf24">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                            </svg>
                            {tmdbRating.toFixed(1)}
                        </div>
                    )}

                    {/* Overview on overlay */}
                    {details?.overview && (
                        <p className="wh-grid-card__overview">{details.overview}</p>
                    )}
                </div>

                {/* Badges on poster */}
                <div className="wh-grid-card__poster-badges">
                    <span className={`wh-grid-card__type-badge wh-grid-card__type-badge--${ti.cls}`}>
                        {ti.emoji} {ti.label}
                    </span>
                    {entry.isRewatch && (
                        <span className="wh-grid-card__rewatch-badge">🔄</span>
                    )}
                </div>
            </div>

            {/* Info area */}
            <div className="wh-grid-card__info">
                <h3 className="wh-grid-card__title" title={entry.title}>
                    {entry.title}
                    {year && <span className="wh-grid-card__year">({year})</span>}
                </h3>

                {/* User rating */}
                {entry.rating && (
                    <div className="wh-grid-card__rating">
                        <MiniStars rating={entry.rating} />
                        <span className="wh-grid-card__rating-num">{entry.rating}/10</span>
                    </div>
                )}

                {/* Meta row */}
                <div className="wh-grid-card__meta">
                    <span className="wh-grid-card__date">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" />
                            <path d="M16 2v4M8 2v4M3 10h18" />
                        </svg>
                        {formatDate(entry.watchedAt)}
                    </span>
                    {entry.watchLocation && (
                        <span className="wh-grid-card__location">
                            <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                            </svg>
                            {entry.watchLocation}
                        </span>
                    )}
                </div>

                {/* Genres (from TMDb) */}
                {details?.genres && details.genres.length > 0 && (
                    <div className="wh-grid-card__genres">
                        {details.genres.slice(0, 3).map((g) => (
                            <span key={g} className="wh-grid-card__genre-chip">{g}</span>
                        ))}
                    </div>
                )}

                {/* Tags */}
                {entry.tags && entry.tags.length > 0 && (
                    <div className="wh-grid-card__tags">
                        {entry.tags.map((tag: string) => (
                            <span key={tag} className="wh-grid-card__tag">#{tag}</span>
                        ))}
                    </div>
                )}

                {/* Engagement row */}
                <div className="wh-grid-card__engagement">
                    <span className="wh-grid-card__stat">
                        <svg width="13" height="13" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                        </svg>
                        {entry._count.likes}
                    </span>
                    <span className="wh-grid-card__stat">
                        <svg width="13" height="13" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                        </svg>
                        {entry._count.comments}
                    </span>
                    {details?.runtime && (
                        <span className="wh-grid-card__stat wh-grid-card__stat--runtime">
                            🕐 {Math.floor(details.runtime / 60)}h {details.runtime % 60}m
                        </span>
                    )}
                    {details?.number_of_seasons && (
                        <span className="wh-grid-card__stat wh-grid-card__stat--runtime">
                            📺 {details.number_of_seasons} season{details.number_of_seasons > 1 ? 's' : ''}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

/* ── Main EntryList Grid ── */
export const EntryList: React.FC<EntryListProps> = ({ onEdit, filters, readOnly }) => {
    const [entries, setEntries] = useState<Entry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [pagination, setPagination] = useState({
        total: 0,
        limit: 20,
        offset: 0,
        hasMore: false,
    });

    const loadEntries = useCallback(async (params?: GetEntriesParams) => {
        try {
            setIsLoading(true);
            setError(null);
            const response = await entriesApi.getEntries({ ...filters, ...params });
            if (params?.offset && params.offset > 0) {
                setEntries(prev => [...prev, ...response.entries]);
            } else {
                setEntries(response.entries);
            }
            setPagination(response.pagination);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to load entries');
        } finally {
            setIsLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        loadEntries();
    }, [loadEntries]);

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this entry?')) return;
        try {
            await entriesApi.deleteEntry(id);
            setEntries((prev) => prev.filter((e) => e.id !== id));
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to delete entry');
        }
    };

    const handleLoadMore = () => {
        loadEntries({ offset: pagination.offset + pagination.limit });
    };

    // Initial Loading State: show grid of skeletons
    if (isLoading && entries.length === 0) {
        return (
            <div className="wh-grid-container">
                <div className="wh-grid-header">
                    <h2>Watch History</h2>
                </div>
                <div className="wh-grid">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                        <div key={i} className="wh-grid-card-skeleton-wrapper">
                            <MovieCardSkeleton />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="py-12 flex justify-center">
                <ErrorState message={error} onRetry={() => loadEntries()} />
            </div>
        );
    }

    if (entries.length === 0) {
        return (
            <EmptyState
                title="No entries found"
                message={typeof filters?.search === 'string' ? `No results for "${filters.search}"` : "Start logging your watch history!"}
                icon={<span>🎬</span>}
            />
        );
    }

    return (
        <div className="wh-grid-container">
            <div className="wh-grid-header">
                <h2>Watch History</h2>
                <span className="wh-grid-count">{pagination.total} {pagination.total === 1 ? 'title' : 'titles'}</span>
            </div>

            <div className="wh-grid">
                {entries.map((entry) => (
                    <EntryCard
                        key={entry.id}
                        entry={entry}
                        onEdit={onEdit}
                        onDelete={readOnly ? undefined : handleDelete}
                    />
                ))}
            </div>

            {pagination.hasMore && (
                <div className="wh-grid-footer">
                    <Button
                        variant="secondary"
                        onClick={handleLoadMore}
                        disabled={isLoading}
                        className="wh-grid-load-more"
                    >
                        {isLoading ? 'Loading More...' : 'Load More'}
                    </Button>
                </div>
            )}
        </div>
    );
};

export default EntryList;
