import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { TweetCard } from '../components/TweetCard';
import { ComposeModal } from '../components/ComposeModal';
import { mockApiGetFeed, Tweet } from '../utils/mockApi';

interface FeedProps {
  onCompose: () => void;
}

export const Feed: React.FC<FeedProps> = ({ onCompose }) => {
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [quoteTweet, setQuoteTweet] = useState<Tweet | null>(null);
  const [showNewTweetsToast, setShowNewTweetsToast] = useState(false);

  const loadTweets = async (offset: number = 0, replace: boolean = false) => {
    if (offset === 0) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const newTweets = await mockApiGetFeed(20, offset);
      if (replace) {
        setTweets(newTweets);
      } else {
        setTweets(prev => [...prev, ...newTweets]);
      }
      setHasMore(newTweets.length === 20);
    } catch (err) {
      console.error('Failed to load tweets:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    loadTweets(0, true);

    // Listen for feed refresh events
    const handleRefresh = () => {
      loadTweets(0, true);
    };
    window.addEventListener('feed-refresh', handleRefresh);

    // Poll for new tweets every 30 seconds
    const pollInterval = setInterval(async () => {
      const latestTweets = await mockApiGetFeed(1, 0);
      if (latestTweets.length > 0 && tweets.length > 0 && latestTweets[0].id !== tweets[0].id) {
        setShowNewTweetsToast(true);
      }
    }, 30000);

    return () => {
      window.removeEventListener('feed-refresh', handleRefresh);
      clearInterval(pollInterval);
    };
  }, []);

  // Infinite scroll
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 300 &&
        !loadingMore &&
        hasMore
      ) {
        loadTweets(tweets.length, false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [tweets.length, loadingMore, hasMore]);

  const handleNewTweetsClick = () => {
    setShowNewTweetsToast(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    loadTweets(0, true);
  };

  return (
    <>
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-[var(--border-color)] px-4 py-3">
        <h1 className="text-xl font-semibold">Home</h1>
      </div>

      {/* New Tweets Toast */}
      {showNewTweetsToast && (
        <button
          onClick={handleNewTweetsClick}
          className="sticky top-[57px] z-10 w-full py-2 bg-[var(--nu-purple)] text-white text-center hover:bg-[var(--nu-purple-hover)] transition-colors"
        >
          New Tweets
        </button>
      )}

      {/* Compose Box */}
      <div
        onClick={onCompose}
        className="border-b border-[var(--border-color)] p-4 cursor-pointer hover:bg-[var(--surface)] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-[var(--nu-purple)] opacity-50" />
          <div className="flex-1 text-[var(--text-muted)]">
            What's happening, Wildcat?
          </div>
        </div>
      </div>

      {/* Tweet List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--nu-purple)]" />
        </div>
      ) : tweets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <span className="text-6xl mb-4">🐾</span>
          <p className="text-[var(--text-muted)]">No tweets yet. Be the first to post!</p>
        </div>
      ) : (
        <>
          {tweets.map((tweet) => (
            <TweetCard
              key={tweet.id}
              tweet={tweet}
              onQuote={(t) => setQuoteTweet(t)}
              onDelete={() => loadTweets(0, true)}
            />
          ))}
          {loadingMore && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-[var(--nu-purple)]" />
            </div>
          )}
        </>
      )}

      {quoteTweet && (
        <ComposeModal
          quotedTweet={quoteTweet}
          onClose={() => setQuoteTweet(null)}
          onSuccess={() => loadTweets(0, true)}
        />
      )}
    </>
  );
};
