import React, { useState } from 'react';
import { Heart, Repeat2, MessageSquareQuote, Trash2, MoreVertical } from 'lucide-react';
import { Tweet, mockApiToggleLike, mockApiToggleRetweet, mockApiDeleteTweet, mockApiGetLikeStatus, mockApiGetRetweetStatus } from '../utils/mockApi';
import { useAuth } from '../contexts/AuthContext';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { formatDistanceToNow } from 'date-fns';

interface TweetCardProps {
  tweet: Tweet;
  onQuote?: (tweet: Tweet) => void;
  onDelete?: () => void;
}

export const TweetCard: React.FC<TweetCardProps> = ({ tweet, onQuote, onDelete }) => {
  const { user, token } = useAuth();
  const [liked, setLiked] = useState(token ? mockApiGetLikeStatus(token, tweet.id) : false);
  const [retweeted, setRetweeted] = useState(token ? mockApiGetRetweetStatus(token, tweet.id) : false);
  const [likeCount, setLikeCount] = useState(tweet.like_count);
  const [retweetCount, setRetweetCount] = useState(tweet.retweet_count);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const isOwner = user?.id === tweet.user_id;

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!token) return;

    const previousLiked = liked;
    const previousCount = likeCount;

    // Optimistic update
    setLiked(!liked);
    setLikeCount(liked ? likeCount - 1 : likeCount + 1);

    try {
      await mockApiToggleLike(token, tweet.id);
    } catch (err) {
      // Rollback on error
      setLiked(previousLiked);
      setLikeCount(previousCount);
    }
  };

  const handleRetweet = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!token) return;

    const previousRetweeted = retweeted;
    const previousCount = retweetCount;

    // Optimistic update
    setRetweeted(!retweeted);
    setRetweetCount(retweeted ? retweetCount - 1 : retweetCount + 1);

    try {
      await mockApiToggleRetweet(token, tweet.id);
    } catch (err) {
      // Rollback on error
      setRetweeted(previousRetweeted);
      setRetweetCount(previousCount);
    }
  };

  const handleDelete = async () => {
    if (!token) return;
    
    try {
      await mockApiDeleteTweet(token, tweet.id);
      setShowDeleteModal(false);
      onDelete?.();
      window.dispatchEvent(new CustomEvent('feed-refresh'));
    } catch (err) {
      console.error('Failed to delete tweet:', err);
    }
  };

  const getAvatarContent = (username: string, profilePicUrl?: string) => {
    if (profilePicUrl) {
      return <img src={profilePicUrl} alt={username} className="w-12 h-12 rounded-full object-cover" />;
    }
    return (
      <div className="w-12 h-12 rounded-full bg-[var(--nu-purple)] text-white flex items-center justify-center font-semibold">
        {username[0].toUpperCase()}
      </div>
    );
  };

  const timeAgo = formatDistanceToNow(new Date(tweet.created_at), { addSuffix: true });

  return (
    <>
      <div className="border-b border-[var(--border-color)] p-4 hover:bg-[var(--surface)] transition-colors">
        {tweet.is_retweet && tweet.original_user && (
          <div className="flex items-center gap-2 mb-2 text-sm text-[var(--text-muted)]">
            <Repeat2 className="w-4 h-4" />
            <span>{tweet.original_user} retweeted</span>
          </div>
        )}

        <div className="flex gap-3">
          {getAvatarContent(tweet.username, tweet.user?.profile_pic_url)}

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-semibold truncate">{tweet.username}</span>
                <span className="text-[var(--text-muted)] truncate">@{tweet.username}</span>
                <span className="text-[var(--text-muted)]">·</span>
                <span className="text-[var(--text-muted)] text-sm whitespace-nowrap">{timeAgo}</span>
              </div>

              {isOwner && (
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(!showMenu);
                    }}
                    className="p-2 hover:bg-[var(--nu-purple-light)] rounded-full transition-colors"
                    aria-label="More options"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>
                  {showMenu && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowMenu(false)}
                      />
                      <div className="absolute right-0 top-full mt-1 bg-white border border-[var(--border-color)] rounded-lg shadow-lg z-20 min-w-[150px]">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowMenu(false);
                            setShowDeleteModal(true);
                          }}
                          className="w-full px-4 py-2 text-left text-[var(--error)] hover:bg-red-50 flex items-center gap-2 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            <p className="mb-3 whitespace-pre-wrap break-words">{tweet.content}</p>

            {tweet.quoted_tweet && (
              <div className="border-l-4 border-[var(--nu-purple)] bg-[var(--surface)] p-3 rounded-lg mb-3">
                {tweet.quoted_tweet.deleted ? (
                  <p className="text-sm italic text-[var(--text-muted)]">This tweet has been deleted.</p>
                ) : (
                  <>
                    <div className="flex items-center gap-2 mb-1">
                      {getAvatarContent(tweet.quoted_tweet.username, tweet.quoted_tweet.user?.profile_pic_url)}
                      <span className="font-semibold text-sm">{tweet.quoted_tweet.username}</span>
                      <span className="text-[var(--text-muted)] text-sm">@{tweet.quoted_tweet.username}</span>
                    </div>
                    <p className="text-sm">{tweet.quoted_tweet.content}</p>
                  </>
                )}
              </div>
            )}

            <div className="flex items-center gap-6 text-[var(--text-muted)]">
              <button
                onClick={handleLike}
                className="flex items-center gap-2 hover:text-red-500 transition-colors group"
                aria-label={liked ? 'Unlike' : 'Like'}
              >
                <Heart className={`w-5 h-5 ${liked ? 'fill-red-500 text-red-500' : ''}`} />
                <span className="text-sm">{likeCount}</span>
              </button>

              <button
                onClick={handleRetweet}
                className="flex items-center gap-2 hover:text-green-500 transition-colors group"
                aria-label={retweeted ? 'Unretweet' : 'Retweet'}
              >
                <Repeat2 className={`w-5 h-5 ${retweeted ? 'text-green-500' : ''}`} />
                <span className="text-sm">{retweetCount}</span>
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onQuote?.(tweet);
                }}
                className="flex items-center gap-2 hover:text-[var(--nu-purple)] transition-colors group"
                aria-label="Quote tweet"
              >
                <MessageSquareQuote className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {showDeleteModal && (
        <DeleteConfirmModal
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDelete}
        />
      )}
    </>
  );
};
