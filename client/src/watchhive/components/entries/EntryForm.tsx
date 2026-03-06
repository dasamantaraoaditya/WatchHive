import React, { useState, useEffect, useRef, useCallback } from 'react';
import { entriesApi, CreateEntryData, Entry } from '../../services/entries.service';
import apiClient from '../../services/api.js';
import './EntryForm.css';

interface EntryFormProps {
    entry?: Entry;
    onSuccess?: (entry: Entry) => void;
    onCancel?: () => void;
}

/* ── TMDb search result shape ── */
interface TmdbResult {
    id: number;
    title?: string;       // movies
    name?: string;        // tv shows
    media_type?: string;
    poster_path: string | null;
    release_date?: string;
    first_air_date?: string;
    overview?: string;
    vote_average?: number;
}

/* ── Star Rating Component ── */
const StarRating: React.FC<{
    value: number | undefined; // 1–10
    onChange: (v: number | undefined) => void;
    disabled?: boolean;
}> = ({ value, onChange, disabled }) => {
    const [hoverValue, setHoverValue] = useState<number | null>(null);
    const display = hoverValue ?? (value ?? 0);

    return (
        <div className="star-rating" role="radiogroup" aria-label="Rating">
            {[1, 2, 3, 4, 5].map((star) => {
                const starValue = star * 2; // map 1-5 stars → 2,4,6,8,10
                const filled = display >= starValue;
                const half = !filled && display >= starValue - 1;

                return (
                    <button
                        key={star}
                        type="button"
                        className={`star-btn ${filled ? 'star--filled' : ''} ${half ? 'star--half' : ''}`}
                        disabled={disabled}
                        onClick={() => {
                            // Toggle off if clicking the already-selected value
                            if (value === starValue) {
                                onChange(undefined);
                            } else {
                                onChange(starValue);
                            }
                        }}
                        onMouseEnter={() => setHoverValue(starValue)}
                        onMouseLeave={() => setHoverValue(null)}
                        aria-label={`${star} star${star > 1 ? 's' : ''}`}
                    >
                        <svg viewBox="0 0 24 24" className="star-icon">
                            {/* Full star */}
                            <path
                                className="star-bg"
                                d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                            />
                            {half && (
                                <path
                                    className="star-half-fill"
                                    d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77V2z"
                                    transform="scale(-1,1) translate(-24,0)"
                                />
                            )}
                        </svg>
                    </button>
                );
            })}
            <span className="star-label">
                {display > 0 ? `${display}/10` : 'Not rated'}
            </span>
        </div>
    );
};

/* ── Watch location quick picks ── */
const LOCATION_PRESETS = [
    { label: '🎬 Cinema', value: 'Cinema' },
    { label: '🏠 Home', value: 'Home' },
    { label: '📺 Netflix', value: 'Netflix' },
    { label: '🟢 Hotstar', value: 'Hotstar' },
    { label: '🔵 Prime', value: 'Prime Video' },
    { label: '🍎 Apple TV', value: 'Apple TV+' },
];

/* ── Main Component ── */
export const EntryForm: React.FC<EntryFormProps> = ({ entry, onSuccess, onCancel }) => {
    const isEditing = !!entry;

    // ── Form state ──
    const [formData, setFormData] = useState<CreateEntryData>({
        tmdbId: entry?.tmdbId || 0,
        title: entry?.title || '',
        type: entry?.type || 'MOVIE',
        watchedAt: entry?.watchedAt
            ? new Date(entry.watchedAt).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0],
        rating: entry?.rating || undefined,
        review: entry?.review || '',
        tags: entry?.tags || [],
        isRewatch: entry?.isRewatch || false,
        watchLocation: entry?.watchLocation || '',
    });

    // ── UI state ──
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<TmdbResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [selectedPoster, setSelectedPoster] = useState<string | null>(null);
    const [selectedOverview, setSelectedOverview] = useState<string | null>(null);
    const [showMoreDetails, setShowMoreDetails] = useState(
        !!(entry?.review || entry?.tags?.length || entry?.watchLocation)
    );
    const [tagInput, setTagInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const searchRef = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // ── Close search results when clicking outside ──
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
                setShowResults(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // ── TMDb search with debounce ──
    const doSearch = useCallback(async (q: string) => {
        if (q.length < 2) {
            setSearchResults([]);
            setShowResults(false);
            return;
        }
        setIsSearching(true);
        try {
            const data: any = await apiClient.get(`/tmdb/search/multi?query=${encodeURIComponent(q)}`);
            // TMDB multi returns `results` array
            const results: TmdbResult[] = (data.results || [])
                .filter((r: any) => r.media_type === 'movie' || r.media_type === 'tv')
                .slice(0, 8);
            setSearchResults(results);
            setShowResults(results.length > 0);
        } catch {
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    }, []);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const q = e.target.value;
        setSearchQuery(q);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => doSearch(q), 350);
    };

    // ── Select a search result ──
    const handleSelectResult = (result: TmdbResult) => {
        const title = result.title || result.name || '';
        const type = result.media_type === 'tv' ? 'TV_SHOW' : 'MOVIE';
        setFormData((prev) => ({
            ...prev,
            tmdbId: result.id,
            title,
            type: type as 'MOVIE' | 'TV_SHOW',
        }));
        setSearchQuery(title);
        setShowResults(false);
        if (result.poster_path) {
            setSelectedPoster(`https://image.tmdb.org/t/p/w342${result.poster_path}`);
        } else {
            setSelectedPoster(null);
        }
        setSelectedOverview(result.overview || null);
    };

    // ── Tags ──
    const handleAddTag = () => {
        const t = tagInput.trim();
        if (t && !formData.tags?.includes(t)) {
            setFormData((prev) => ({ ...prev, tags: [...(prev.tags || []), t] }));
            setTagInput('');
        }
    };

    const handleRemoveTag = (tag: string) => {
        setFormData((prev) => ({
            ...prev,
            tags: prev.tags?.filter((t) => t !== tag) || [],
        }));
    };

    // ── Submit ──
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.tmdbId || !formData.title) {
            setError('Please search for and select a movie or TV show');
            return;
        }
        setIsLoading(true);
        setError(null);

        try {
            let savedEntry: Entry;
            if (isEditing && entry) {
                const { tmdbId, ...updateData } = formData;
                savedEntry = await entriesApi.updateEntry(entry.id, updateData);
            } else {
                savedEntry = await entriesApi.createEntry(formData as CreateEntryData);
            }
            onSuccess?.(savedEntry);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to save entry');
        } finally {
            setIsLoading(false);
        }
    };

    // ── Helpers ──
    const yearOf = (r: TmdbResult) => {
        const d = r.release_date || r.first_air_date;
        return d ? d.slice(0, 4) : '';
    };

    const hasSelection = formData.tmdbId > 0 && formData.title.length > 0;

    return (
        <div className="entry-form-container">
            <div className="entry-form-card">
                {/* ── Header ── */}
                <div className="entry-form-header">
                    <h2 className="entry-form-title">
                        {isEditing ? '✏️ Edit Entry' : '🎬 Log a Watch'}
                    </h2>
                    <p className="entry-form-subtitle">
                        {isEditing
                            ? 'Update the details of your entry'
                            : 'Search for a movie or show, rate it, and save'}
                    </p>
                </div>

                {error && (
                    <div className="entry-form-error">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="entry-form">
                    {/* ── Step 1: Search & Select ── */}
                    {!isEditing && (
                        <div className="form-section">
                            <div className="form-section-label">What did you watch?</div>
                            <div className="search-container" ref={searchRef}>
                                <div className="search-input-wrapper">
                                    <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="11" cy="11" r="8" />
                                        <path d="m21 21-4.35-4.35" />
                                    </svg>
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={handleSearchChange}
                                        onFocus={() => searchResults.length > 0 && setShowResults(true)}
                                        className="search-input"
                                        placeholder="Search movies or TV shows…"
                                        autoComplete="off"
                                    />
                                    {isSearching && <div className="search-spinner" />}
                                </div>

                                {/* Results dropdown */}
                                {showResults && (
                                    <div className="search-results">
                                        {searchResults.map((r) => (
                                            <button
                                                key={r.id}
                                                type="button"
                                                className="search-result-item"
                                                onClick={() => handleSelectResult(r)}
                                            >
                                                {r.poster_path ? (
                                                    <img
                                                        src={`https://image.tmdb.org/t/p/w92${r.poster_path}`}
                                                        alt=""
                                                        className="result-poster"
                                                    />
                                                ) : (
                                                    <div className="result-poster-placeholder">
                                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                                            <path d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                                                        </svg>
                                                    </div>
                                                )}
                                                <div className="result-info">
                                                    <span className="result-title">{r.title || r.name}</span>
                                                    <span className="result-meta">
                                                        <span className={`result-type result-type--${r.media_type}`}>
                                                            {r.media_type === 'tv' ? 'TV' : 'Movie'}
                                                        </span>
                                                        {yearOf(r) && <span>{yearOf(r)}</span>}
                                                        {r.vote_average != null && r.vote_average > 0 && (
                                                            <span className="result-score">⭐ {r.vote_average.toFixed(1)}</span>
                                                        )}
                                                    </span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Selection preview */}
                            {hasSelection && (
                                <div className="selection-preview">
                                    {selectedPoster && (
                                        <img src={selectedPoster} alt={formData.title} className="selection-poster" />
                                    )}
                                    <div className="selection-info">
                                        <h3>{formData.title}</h3>
                                        <span className={`type-badge type-badge--${formData.type.toLowerCase()}`}>
                                            {formData.type === 'TV_SHOW' ? '📺 TV Show' : formData.type === 'EPISODE' ? '📼 Episode' : '🎬 Movie'}
                                        </span>
                                        {selectedOverview && (
                                            <p className="selection-overview">{selectedOverview}</p>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        className="selection-clear"
                                        onClick={() => {
                                            setFormData((prev) => ({ ...prev, tmdbId: 0, title: '', type: 'MOVIE' }));
                                            setSearchQuery('');
                                            setSelectedPoster(null);
                                            setSelectedOverview(null);
                                        }}
                                        aria-label="Clear selection"
                                    >
                                        ✕
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Editing: show title read-only */}
                    {isEditing && (
                        <div className="form-section">
                            <div className="form-section-label">Title</div>
                            <div className="edit-title-display">{formData.title}</div>
                        </div>
                    )}

                    {/* ── Step 2: Rate ── */}
                    <div className="form-section">
                        <div className="form-section-label">How would you rate it?</div>
                        <StarRating
                            value={formData.rating}
                            onChange={(v) => setFormData((prev) => ({ ...prev, rating: v }))}
                        />
                    </div>

                    {/* ── Step 3: When ── */}
                    <div className="form-row">
                        <div className="form-section form-section--half">
                            <div className="form-section-label">When did you watch?</div>
                            <input
                                type="date"
                                name="watchedAt"
                                value={formData.watchedAt}
                                onChange={(e) => setFormData((prev) => ({ ...prev, watchedAt: e.target.value }))}
                                className="form-input"
                            />
                        </div>

                        <div className="form-section form-section--half">
                            <div className="form-section-label">&nbsp;</div>
                            <label className="rewatch-toggle">
                                <input
                                    type="checkbox"
                                    checked={formData.isRewatch}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, isRewatch: e.target.checked }))}
                                />
                                <span className="rewatch-slider" />
                                <span className="rewatch-label">Rewatch</span>
                            </label>
                        </div>
                    </div>

                    {/* ── Optional Details Toggle ── */}
                    <button
                        type="button"
                        className={`more-details-toggle ${showMoreDetails ? 'open' : ''}`}
                        onClick={() => setShowMoreDetails((v) => !v)}
                    >
                        <span>
                            {showMoreDetails ? 'Less details' : 'Add more details'}
                        </span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m6 9 6 6 6-6" />
                        </svg>
                    </button>

                    {showMoreDetails && (
                        <div className="more-details-section">
                            {/* Watch Location */}
                            <div className="form-section">
                                <div className="form-section-label">Where did you watch?</div>
                                <div className="location-presets">
                                    {LOCATION_PRESETS.map((l) => (
                                        <button
                                            key={l.value}
                                            type="button"
                                            className={`location-chip ${formData.watchLocation === l.value ? 'location-chip--active' : ''}`}
                                            onClick={() =>
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    watchLocation: prev.watchLocation === l.value ? '' : l.value,
                                                }))
                                            }
                                        >
                                            {l.label}
                                        </button>
                                    ))}
                                </div>
                                <input
                                    type="text"
                                    value={formData.watchLocation || ''}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, watchLocation: e.target.value }))}
                                    className="form-input form-input--sm"
                                    placeholder="Or type a custom location…"
                                />
                            </div>

                            {/* Review */}
                            <div className="form-section">
                                <div className="form-section-label">Your thoughts</div>
                                <textarea
                                    value={formData.review || ''}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, review: e.target.value }))}
                                    className="form-textarea"
                                    rows={3}
                                    placeholder="Write a short review…"
                                />
                            </div>

                            {/* Tags */}
                            <div className="form-section">
                                <div className="form-section-label">Tags</div>
                                <div className="tag-input-wrapper">
                                    <input
                                        type="text"
                                        value={tagInput}
                                        onChange={(e) => setTagInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                handleAddTag();
                                            }
                                        }}
                                        className="form-input"
                                        placeholder="Type a tag and press Enter"
                                    />
                                </div>
                                {formData.tags && formData.tags.length > 0 && (
                                    <div className="tags-list">
                                        {formData.tags.map((tag) => (
                                            <span key={tag} className="tag">
                                                {tag}
                                                <button type="button" onClick={() => handleRemoveTag(tag)} className="tag-remove">
                                                    ×
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ── Actions ── */}
                    <div className="form-actions">
                        {onCancel && (
                            <button type="button" onClick={onCancel} className="btn-secondary" disabled={isLoading}>
                                Cancel
                            </button>
                        )}
                        <button
                            type="submit"
                            className="btn-primary"
                            disabled={isLoading || (!isEditing && !hasSelection)}
                        >
                            {isLoading ? (
                                <>
                                    <span className="btn-spinner" />
                                    Saving…
                                </>
                            ) : isEditing ? (
                                'Update Entry'
                            ) : (
                                '✓ Save Entry'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EntryForm;
