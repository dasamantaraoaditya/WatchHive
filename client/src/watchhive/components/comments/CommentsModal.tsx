import React, { useState, useEffect } from 'react';
import { Avatar, Button, Input } from '../common';
import { interactionService, Comment } from '../../services/interaction.service';
import { useAuth } from '../../contexts';
import './CommentsModal.css';

interface CommentsModalProps {
    isOpen: boolean;
    onClose: () => void;
    entryId: string;
    onCommentAdded?: () => void;
}

export const CommentsModal: React.FC<CommentsModalProps> = ({ isOpen, onClose, entryId, onCommentAdded }) => {
    const { user } = useAuth();
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen && entryId) {
            fetchComments();
        }
    }, [isOpen, entryId]);

    const fetchComments = async () => {
        setIsLoading(true);
        try {
            const data = await interactionService.getComments(entryId);
            setComments(data.comments);
        } catch (error) {
            console.error('Failed to fetch comments', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        setIsSubmitting(true);
        try {
            const data = await interactionService.addComment(entryId, newComment);
            setComments([data.comment, ...comments]);
            setNewComment('');
            if (onCommentAdded) onCommentAdded();
        } catch (error) {
            console.error('Failed to post comment', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (commentId: string) => {
        if (!window.confirm('Delete this comment?')) return;
        try {
            await interactionService.deleteComment(commentId);
            setComments(comments.filter(c => c.id !== commentId));
        } catch (error) {
            console.error('Failed to delete comment', error);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content comments-modal" onClick={e => e.stopPropagation()}>
                <div className="comments-header">
                    <h3>Comments</h3>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>

                <div className="comments-list">
                    {isLoading ? (
                        <p className="loading-text">Loading comments...</p>
                    ) : comments.length === 0 ? (
                        <p className="empty-text">No comments yet. Be the first!</p>
                    ) : (
                        comments.map(comment => (
                            <div key={comment.id} className="comment-item">
                                <Avatar
                                    src={comment.user.profilePictureUrl || undefined}
                                    name={comment.user.displayName || comment.user.username}
                                    size="sm"
                                />
                                <div className="comment-body">
                                    <div className="comment-meta">
                                        <span className="comment-author">{comment.user.displayName || comment.user.username}</span>
                                        <span className="comment-date">{new Date(comment.createdAt).toLocaleDateString()}</span>
                                        {(user?.id === comment.userId) && (
                                            <button
                                                className="delete-comment-btn"
                                                onClick={() => handleDelete(comment.id)}
                                                title="Delete"
                                            >
                                                🗑️
                                            </button>
                                        )}
                                    </div>
                                    <p className="comment-text">{comment.content}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <form className="comment-form" onSubmit={handleSubmit}>
                    <Input
                        value={newComment}
                        onChange={e => setNewComment(e.target.value)}
                        placeholder="Add a comment..."
                        disabled={isSubmitting}
                    />
                    <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
                        Post
                    </Button>
                </form>
            </div>
        </div>
    );
};
