import { useState, useEffect, useCallback } from 'react';
import { getFeed } from '../api';
import { TweetCard } from '../components/TweetCard';
import { ComposeBox } from '../components/ComposeBox';

function normalizeTweet(t) {
  return {
    id: t.id,
    text: t.content || t.text,
    author: {
      id: t.user_id,
      username: t.username || t.author?.username,
      display_name: t.username || t.author?.display_name || t.author?.username,
      profile_picture_url: t.author?.profile_pic_url || t.author?.profile_picture_url,
    },
    created_at: t.created_at,
    like_count: t.like_count ?? 0,
    retweet_count: t.retweet_count ?? 0,
    liked_by_me: t.liked_by_me ?? false,
    retweeted_by_me: t.retweeted_by_me ?? false,
    retweeted_tweet: t.retweeted_tweet,
    quoted_tweet: t.quoted_tweet,
  };
}

export function Feed({ onCompose }) {
  const [tweets, setTweets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const limit = 20;

  const loadFeed = useCallback(async (off = 0, append = false) => {
    if (append) setLoadingMore(true);
    else setLoading(true);
    setError('');
    try {
      const data = await getFeed(limit, off);
      const list = (data.tweets || []).map(normalizeTweet);
      setTweets((prev) => (append ? [...prev, ...list] : list));
      setHasMore(list.length >= limit);
      setOffset(off + list.length);
    } catch (err) {
      setError(err.message || 'Failed to load feed');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    loadFeed(0, false);
  }, [loadFeed]);

  useEffect(() => {
    const onRefresh = () => loadFeed(0, false);
    window.addEventListener('feed-refresh', onRefresh);
    return () => window.removeEventListener('feed-refresh', onRefresh);
  }, [loadFeed]);

  const handleScroll = useCallback(() => {
    const el = document.documentElement;
    if (loadingMore || !hasMore) return;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 300) {
      loadFeed(offset, true);
    }
  }, [loadFeed, offset, loadingMore, hasMore]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const handleTweetDeleted = (id) => {
    setTweets((prev) => prev.filter((t) => t.id !== id));
  };

  const handleRefresh = () => loadFeed(0, false);

  if (loading && tweets.length === 0) {
    return <div className="loading">Loading feed...</div>;
  }

  return (
    <>
      <div className="feed-header">Home</div>
      {onCompose && <ComposeBox onCompose={onCompose} />}
      <div className="feed-content">
        {error && <div className="error-msg">{error}</div>}
        {tweets.map((t) => (
          <TweetCard
            key={t.id}
            tweet={t}
            onUpdate={handleRefresh}
            onDeleted={() => handleTweetDeleted(t.id)}
          />
        ))}
        {loadingMore && <div className="loading">Loading more...</div>}
        {!loading && tweets.length === 0 && !error && (
          <div className="loading">No tweets yet. Be the first to post!</div>
        )}
      </div>
    </>
  );
}
