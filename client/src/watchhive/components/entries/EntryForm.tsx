import React, { useState } from 'react';
import { entriesApi, CreateEntryData, Entry } from '../../services/entries.service';
import './EntryForm.css';

interface EntryFormProps {
    entry?: Entry; // If provided, we're editing; otherwise, creating
    onSuccess?: (entry: Entry) => void;
    onCancel?: () => void;
}

export const EntryForm: React.FC<EntryFormProps> = ({ entry, onSuccess, onCancel }) => {
    const isEditing = !!entry;

    const [formData, setFormData] = useState<CreateEntryData>({
        tmdbId: entry?.tmdbId || 0,
        title: entry?.title || '',
        type: entry?.type || 'MOVIE',
        watchedAt: entry?.watchedAt ? new Date(entry.watchedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        rating: entry?.rating || undefined,
        review: entry?.review || '',
        tags: entry?.tags || [],
        isRewatch: entry?.isRewatch || false,
        watchLocation: entry?.watchLocation || '',
    });

    const [tagInput, setTagInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;

        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            setFormData((prev) => ({ ...prev, [name]: checked }));
        } else if (name === 'rating') {
            setFormData((prev) => ({ ...prev, [name]: value ? parseInt(value) : undefined }));
        } else if (name === 'tmdbId') {
            setFormData((prev) => ({ ...prev, [name]: parseInt(value) || 0 }));
        } else {
            setFormData((prev) => ({ ...prev, [name]: value }));
        }
    };

    const handleAddTag = () => {
        if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
            setFormData((prev) => ({
                ...prev,
                tags: [...(prev.tags || []), tagInput.trim()],
            }));
            setTagInput('');
        }
    };

    const handleRemoveTag = (tagToRemove: string) => {
        setFormData((prev) => ({
            ...prev,
            tags: prev.tags?.filter((tag) => tag !== tagToRemove) || [],
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            let savedEntry: Entry;

            if (isEditing && entry) {
                // Exclude tmdbId from update payload (it's immutable)
                const { tmdbId, ...updateData } = formData;
                savedEntry = await entriesApi.updateEntry(entry.id, updateData);
            } else {
                savedEntry = await entriesApi.createEntry(formData as CreateEntryData);
            }

            if (onSuccess) {
                onSuccess(savedEntry);
            }
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to save entry');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="entry-form-container">
            <div className="entry-form-card">
                <h2 className="entry-form-title">
                    {isEditing ? 'Edit Entry' : 'Add New Entry'}
                </h2>

                {error && (
                    <div className="entry-form-error">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="entry-form">
                    {/* TMDb ID (only for new entries) */}
                    {!isEditing && (
                        <div className="form-group">
                            <label htmlFor="tmdbId" className="form-label required">
                                TMDb ID
                            </label>
                            <input
                                id="tmdbId"
                                type="number"
                                name="tmdbId"
                                value={formData.tmdbId}
                                onChange={handleChange}
                                className="form-input"
                                required
                                placeholder="e.g., 550"
                            />
                            <span className="form-helper">
                                Find the TMDb ID from themoviedb.org
                            </span>
                        </div>
                    )}

                    {/* Title */}
                    <div className="form-group">
                        <label htmlFor="title" className="form-label required">
                            Title
                        </label>
                        <input
                            id="title"
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            className="form-input"
                            required
                            placeholder="e.g., Fight Club"
                        />
                    </div>

                    {/* Type */}
                    <div className="form-group">
                        <label htmlFor="type" className="form-label required">
                            Type
                        </label>
                        <select
                            id="type"
                            name="type"
                            value={formData.type}
                            onChange={handleChange}
                            className="form-input"
                            required
                        >
                            <option value="MOVIE">Movie</option>
                            <option value="TV_SHOW">TV Show</option>
                            <option value="EPISODE">Episode</option>
                        </select>
                    </div>

                    {/* Watched Date */}
                    <div className="form-group">
                        <label htmlFor="watchedAt" className="form-label">
                            Watched Date
                        </label>
                        <input
                            id="watchedAt"
                            type="date"
                            name="watchedAt"
                            value={formData.watchedAt}
                            onChange={handleChange}
                            className="form-input"
                        />
                    </div>

                    {/* Rating */}
                    <div className="form-group">
                        <label htmlFor="rating" className="form-label">
                            Rating (1-10)
                        </label>
                        <input
                            id="rating"
                            type="number"
                            name="rating"
                            min="1"
                            max="10"
                            value={formData.rating || ''}
                            onChange={handleChange}
                            className="form-input"
                            placeholder="Optional"
                        />
                    </div>

                    {/* Review */}
                    <div className="form-group">
                        <label htmlFor="review" className="form-label">
                            Review
                        </label>
                        <textarea
                            id="review"
                            name="review"
                            value={formData.review || ''}
                            onChange={handleChange}
                            className="form-textarea"
                            rows={4}
                            placeholder="Share your thoughts..."
                        />
                    </div>

                    {/* Tags */}
                    <div className="form-group">
                        <label className="form-label">Tags</label>
                        <div className="tag-input-wrapper">
                            <input
                                type="text"
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleAddTag();
                                    }
                                }}
                                className="form-input"
                                placeholder="Add a tag and press Enter"
                            />
                            <button
                                type="button"
                                onClick={handleAddTag}
                                className="tag-add-btn"
                            >
                                Add
                            </button>
                        </div>
                        {formData.tags && formData.tags.length > 0 && (
                            <div className="tags-list">
                                {formData.tags.map((tag) => (
                                    <span key={tag} className="tag">
                                        {tag}
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveTag(tag)}
                                            className="tag-remove"
                                        >
                                            ×
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Watch Location */}
                    <div className="form-group">
                        <label htmlFor="watchLocation" className="form-label">
                            Watch Location
                        </label>
                        <input
                            id="watchLocation"
                            type="text"
                            name="watchLocation"
                            value={formData.watchLocation || ''}
                            onChange={handleChange}
                            className="form-input"
                            placeholder="e.g., Netflix, Cinema, Home"
                        />
                    </div>

                    {/* Is Rewatch */}
                    <div className="form-group-checkbox">
                        <input
                            id="isRewatch"
                            type="checkbox"
                            name="isRewatch"
                            checked={formData.isRewatch}
                            onChange={handleChange}
                            className="form-checkbox"
                        />
                        <label htmlFor="isRewatch" className="form-label-checkbox">
                            This is a rewatch
                        </label>
                    </div>

                    {/* Actions */}
                    <div className="form-actions">
                        {onCancel && (
                            <button
                                type="button"
                                onClick={onCancel}
                                className="btn-secondary"
                                disabled={isLoading}
                            >
                                Cancel
                            </button>
                        )}
                        <button
                            type="submit"
                            className="btn-primary"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Saving...' : isEditing ? 'Update Entry' : 'Add Entry'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EntryForm;
