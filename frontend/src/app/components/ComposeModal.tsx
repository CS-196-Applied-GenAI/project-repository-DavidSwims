import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { mockApiPostTweet, Tweet } from '../utils/mockApi';

interface ComposeModalProps {
  onClose: () => void;
  quotedTweet?: Tweet | null;
  onSuccess?: () => void;
}

export const ComposeModal: React.FC<ComposeModalProps> = ({ onClose, quotedTweet, onSuccess }) => {
  const { user, token } = useAuth();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const charCount = content.length;
  const maxChars = 280;
  const isOverLimit = charCount > maxChars;
  const isNearLimit = charCount > maxChars * 0.9;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !content.trim() || isOverLimit) return;

    setLoading(true);
    try {
      await mockApiPostTweet(token, content, quotedTweet?.id);
      onSuccess?.();
      onClose();
      // Dispatch feed refresh event
      window.dispatchEvent(new CustomEvent('feed-refresh'));
    } catch (err) {
      console.error('Failed to post tweet:', err);
      setLoading(false);
    }
  };

  const getAvatarContent = () => {
    if (user?.profile_pic_url) {
      return <img src={user.profile_pic_url} alt={user.username} className="w-12 h-12 rounded-full" />;
    }
    return (
      <div className="w-12 h-12 rounded-full bg-[var(--nu-purple)] text-white flex items-center justify-center font-semibold">
        {user?.username[0].toUpperCase()}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)]">
          <h2 className="text-xl font-semibold">
            {quotedTweet ? 'Quote Tweet' : 'Create Post'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--surface)] rounded-full transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4">
          <div className="flex gap-3">
            {getAvatarContent()}
            <div className="flex-1">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What's happening, Wildcat?"
                className="w-full min-h-[120px] text-lg resize-none focus:outline-none"
                autoFocus
              />

              {quotedTweet && (
                <div className="mt-3 border-l-4 border-[var(--nu-purple)] bg-[var(--surface)] p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    {quotedTweet.user?.profile_pic_url ? (
                      <img
                        src={quotedTweet.user.profile_pic_url}
                        alt={quotedTweet.username}
                        className="w-6 h-6 rounded-full"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-[var(--nu-purple)] text-white flex items-center justify-center text-xs">
                        {quotedTweet.username[0].toUpperCase()}
                      </div>
                    )}
                    <span className="font-semibold">{quotedTweet.username}</span>
                    <span className="text-[var(--text-muted)]">@{quotedTweet.username}</span>
                  </div>
                  <p className="text-sm">{quotedTweet.content}</p>
                </div>
              )}

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-[var(--border-color)]">
                <div
                  className={`text-sm ${
                    isOverLimit
                      ? 'text-[var(--error)]'
                      : isNearLimit
                      ? 'text-amber-500'
                      : 'text-[var(--text-muted)]'
                  }`}
                >
                  {charCount} / {maxChars}
                </div>
                <button
                  type="submit"
                  disabled={loading || !content.trim() || isOverLimit}
                  className="px-6 py-2 bg-[var(--nu-purple)] text-white rounded-full hover:bg-[var(--nu-purple-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Post
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
