import { useState } from 'react';
import { createTweet } from '../api';

const MAX_LEN = 280;

export function ComposeModal({ onClose, onPosted, parentTweetId }) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const remaining = MAX_LEN - text.length;
  const over = remaining < 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim() || over) return;
    setLoading(true);
    setError('');
    try {
      await createTweet({ text: text.trim(), parent_tweet_id: parentTweetId || undefined });
      onPosted?.();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 600 }}>
        <div className="modal-header">
          <h2 className="modal-title">{parentTweetId ? 'Quote tweet' : 'Compose'}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">&times;</button>
        </div>
        <form onSubmit={handleSubmit}>
          <textarea
            className="compose-textarea"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="What's happening?"
            maxLength={MAX_LEN + 100}
            autoFocus
          />
          <div className="compose-footer">
            <span className={`char-count ${over ? 'over' : remaining <= 20 ? 'warning' : ''}`}>
              {over ? remaining : remaining <= 20 ? remaining : ''}
            </span>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!text.trim() || over || loading}
            >
              {loading ? 'Posting...' : 'Post'}
            </button>
          </div>
        </form>
        {error && <div className="form-error" style={{ padding: 16 }}>{error}</div>}
      </div>
    </div>
  );
}
