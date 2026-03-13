import { Link } from 'react-router-dom';
import { useState } from 'react';
import { likeTweet, retweetTweet, deleteTweet } from '../api';
import { useAuth } from '../context/AuthContext';

function formatTime(iso) {
  const d = new Date(iso);
  const now = new Date();
  const diff = (now - d) / 1000;
  if (diff < 60) return 'now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
  return d.toLocaleDateString();
}

export function TweetCard({ tweet, onUpdate, onDeleted }) {
  const { user } = useAuth();
  const [liked, setLiked] = useState(tweet.liked_by_me);
  const [likeCount, setLikeCount] = useState(tweet.like_count ?? 0);
  const [retweeted, setRetweeted] = useState(tweet.retweeted_by_me);
  const [retweetCount, setRetweetCount] = useState(tweet.retweet_count ?? 0);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isOwner = user?.id === tweet.author?.id;

  const handleLike = async () => {
    const prev = { liked, likeCount };
    setLiked(!liked);
    setLikeCount(c => liked ? c - 1 : c + 1);
    try {
      await likeTweet(tweet.id);
      if (onUpdate) onUpdate();
    } catch {
      setLiked(prev.liked);
      setLikeCount(prev.likeCount);
    }
  };

  const handleRetweet = async () => {
    const prev = { retweeted, retweetCount };
    setRetweeted(!retweeted);
    setRetweetCount(c => retweeted ? c - 1 : c + 1);
    try {
      await retweetTweet(tweet.id);
      if (onUpdate) onUpdate();
    } catch {
      setRetweeted(prev.retweeted);
      setRetweetCount(prev.retweetCount);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteTweet(tweet.id);
      onDeleted?.();
    } catch (err) {
      alert(err.message || 'Failed to delete');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const author = tweet.author || tweet.retweeted_tweet?.author;
  const displayTweet = tweet.retweeted_tweet || tweet;
  const isRetweet = !!tweet.retweeted_tweet;

  return (
    <article className="tweet">
      {isRetweet && (
        <div style={{ color: 'var(--gray-500)', fontSize: 14, marginBottom: 4 }}>
          🔁 {tweet.author?.display_name || tweet.author?.username} retweeted
        </div>
      )}
      <div className="tweet-header">
        <Link to={`/profile/${author?.username}`} className="tweet-avatar">
          {(author?.profile_picture_url || author?.profile_pic_url) ? (
            <img src={author.profile_picture_url || author.profile_pic_url} alt="" />
          ) : (
            (author?.display_name || author?.username || '?').charAt(0).toUpperCase()
          )}
        </Link>
        <div className="tweet-meta">
          <Link to={`/profile/${author?.username}`} className="tweet-author">
            {author?.display_name || author?.username || 'Unknown'}
          </Link>
          <span className="tweet-username">@{author?.username}</span>
          <span className="tweet-time">· {formatTime(displayTweet.created_at)}</span>
        </div>
      </div>
      <div className="tweet-body">{displayTweet.text}</div>
      {displayTweet.quoted_tweet && (
        <div className="quote-tweet">
          {displayTweet.quoted_tweet.deleted ? (
            <div className="deleted-tweet">This tweet was deleted</div>
          ) : (
            <TweetCard tweet={displayTweet.quoted_tweet} />
          )}
        </div>
      )}
      <div className="tweet-actions">
        <button
          className={`tweet-action ${liked ? 'liked' : ''}`}
          onClick={handleLike}
          title="Like"
        >
          <span>{liked ? '❤️' : '🤍'}</span>
          <span>{likeCount > 0 ? likeCount : ''}</span>
        </button>
        <button
          className={`tweet-action ${retweeted ? 'retweeted' : ''}`}
          onClick={handleRetweet}
          title="Retweet"
        >
          <span>🔁</span>
          <span>{retweetCount > 0 ? retweetCount : ''}</span>
        </button>
        {isOwner && (
          <button
            className="tweet-action"
            onClick={() => setShowDeleteConfirm(true)}
            title="Delete"
          >
            <span>🗑️</span>
          </button>
        )}
      </div>
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 360 }}>
            <div className="modal-header">
              <h2 className="modal-title">Delete tweet?</h2>
              <button className="modal-close" onClick={() => setShowDeleteConfirm(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: 16 }}>This can't be undone.</p>
              <div style={{ display: 'flex', gap: 12 }}>
                <button className="btn btn-secondary" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleDelete} disabled={deleting} style={{ background: 'var(--error)' }}>
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
