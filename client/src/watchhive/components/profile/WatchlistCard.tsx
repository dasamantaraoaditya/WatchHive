import React, { useState, useEffect } from 'react';
import { WatchlistButton } from '../common';
import { useWatchlist } from '../../contexts/WatchlistContext';
import { entriesApi, CreateEntryData } from '../../services/entries.service';
import apiClient from '../../services/api.js';
import './Profile.css';

interface WatchlistCardProps {
    tmdbId: number;
    mediaType?: string;
}

const TMDB_IMG = 'https://image.tmdb.org/t/p/w185';

export const WatchlistCard: React.FC<WatchlistCardProps> = ({ tmdbId, mediaType = 'movie' }) => {
    const [details, setDetails] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [marking, setMarking] = useState(false);
    const { removeFromList } = useWatchlist();

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const endpoint = mediaType === 'tv' ? 'tv' : 'movie';
                const data = await apiClient.get(`/tmdb/${endpoint}/${tmdbId}`);
                setDetails(data);
            } catch (err) {
                console.error('Failed to load watchlist item', err);
            } finally {
                setLoading(false);
            }
        };

        fetchDetails();
    }, [tmdbId, mediaType]);

    const handleMarkAsWatched = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (marking || !details) return;

        setMarking(true);
        try {
            const entryData: CreateEntryData = {
                tmdbId: Number(tmdbId),
                title: details.title || details.name,
                type: mediaType === 'tv' ? 'TV_SHOW' : 'MOVIE',
                watchedAt: new Date().toISOString().split('T')[0],
                review: '',
                tags: []
            };

            await entriesApi.createEntry(entryData);
            await removeFromList(tmdbId);
        } catch (error) {
            console.error('Failed to mark as watched', error);
            alert('Failed to mark as watched. Please try again.');
        } finally {
            setMarking(false);
        }
    };

    if (loading) {
        return <div className="watchlist-card skeleton"></div>;
    }

    if (!details) return null;

    const title = details.title || details.name;
    const date = details.release_date || details.first_air_date;
    const year = date ? date.split('-')[0] : '';
    const rating = details.vote_average ? details.vote_average.toFixed(1) : '';

    return (
        <div className="watchlist-card">
            <div className="watchlist-card__poster-wrapper">
                {details.poster_path ? (
                    <img
                        src={`${TMDB_IMG}${details.poster_path}`}
                        alt={title}
                        className="watchlist-card__poster"
                    />
                ) : (
                    <div className="watchlist-card__no-poster">Top Secret 🎬</div>
                )}

                <div className="watchlist-card__overlay">
                    <WatchlistButton tmdbId={tmdbId} mediaType={mediaType as any} variant="icon" />
                </div>

                <div className="watchlist-card__hover-action">
                    <button
                        className="watchlist-mark-btn"
                        onClick={handleMarkAsWatched}
                        disabled={marking}
                        title="Mark as Watched"
                    >
                        {marking ? '⏳' : '✅ Watched'}
                    </button>
                </div>
            </div>
            <div className="watchlist-card__info">
                <h4 className="watchlist-card__title" title={title}>{title}</h4>
                <div className="watchlist-card__meta">
                    {year && <span>{year}</span>}
                    {rating && (
                        <span className="watchlist-card__rating">⭐ {rating}</span>
                    )}
                </div>
                <span className={`watchlist-badge watchlist-badge--${mediaType}`}>
                    {mediaType === 'tv' ? 'TV' : 'Movie'}
                </span>
            </div>
        </div>
    );
};
