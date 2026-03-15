import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router';
import { Loader2 } from 'lucide-react';
import { TweetCard } from '../components/TweetCard';
import { EditProfileModal } from '../components/EditProfileModal';
import { ComposeModal } from '../components/ComposeModal';
import { mockApiGetUserProfile, User, Tweet } from '../utils/mockApi';
import { useAuth } from '../contexts/AuthContext';

export const Profile: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const { user: currentUser } = useAuth();
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'tweets' | 'likes'>('tweets');
  const [showEditModal, setShowEditModal] = useState(false);
  const [quoteTweet, setQuoteTweet] = useState<Tweet | null>(null);

  const isOwnProfile = currentUser?.username === username;

  const loadProfile = async () => {
    if (!username) return;
    
    setLoading(true);
    try {
      const { user, tweets: userTweets } = await mockApiGetUserProfile(username, tab);
      setProfileUser(user);
      setTweets(userTweets);
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [username, tab]);

  const getAvatarContent = () => {
    if (profileUser?.profile_pic_url) {
      return (
        <img
          src={profileUser.profile_pic_url}
          alt={profileUser.username}
          className="w-20 h-20 rounded-full object-cover border-4 border-white -mt-10"
        />
      );
    }
    return (
      <div className="w-20 h-20 rounded-full bg-[var(--nu-purple)] text-white flex items-center justify-center text-3xl font-semibold border-4 border-white -mt-10">
        {profileUser?.username[0].toUpperCase()}
      </div>
    );
  };

  if (loading && !profileUser) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--nu-purple)]" />
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="text-center py-12">
        <p className="text-[var(--text-muted)]">User not found</p>
      </div>
    );
  }

  return (
    <>
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-[var(--border-color)] px-4 py-3">
        <h1 className="text-xl font-semibold">Profile</h1>
      </div>

      {/* Profile Header */}
      <div className="border-b border-[var(--border-color)]">
        {/* Banner */}
        <div className="h-[150px] bg-gradient-to-r from-[var(--nu-purple)] to-[var(--nu-purple-hover)]" />

        {/* Profile Info */}
        <div className="px-4 pb-4">
          {getAvatarContent()}

          <div className="flex items-start justify-between mt-3 mb-4">
            <div className="flex-1">
              <h2 className="text-xl font-semibold">{profileUser.username}</h2>
              <p className="text-[var(--text-muted)]">@{profileUser.username}</p>
            </div>

            {isOwnProfile && (
              <button
                onClick={() => setShowEditModal(true)}
                className="px-6 py-2 border-2 border-[var(--nu-purple)] text-[var(--nu-purple)] rounded-full hover:bg-[var(--nu-purple-light)] transition-colors"
              >
                Edit Profile
              </button>
            )}
          </div>

          {profileUser.bio && (
            <p className="mb-4">{profileUser.bio}</p>
          )}

          <div className="flex gap-6 text-sm mb-4">
            <div>
              <span className="font-semibold">{tweets.length}</span>{' '}
              <span className="text-[var(--text-muted)]">Tweets</span>
            </div>
            <div>
              <span className="font-semibold">0</span>{' '}
              <span className="text-[var(--text-muted)]">Following</span>
            </div>
            <div>
              <span className="font-semibold">0</span>{' '}
              <span className="text-[var(--text-muted)]">Followers</span>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-[var(--border-color)] -mx-4 px-4">
            <button
              onClick={() => setTab('tweets')}
              className={`flex-1 py-3 relative ${
                tab === 'tweets' ? 'font-semibold' : 'text-[var(--text-muted)]'
              }`}
            >
              Tweets
              {tab === 'tweets' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-[var(--nu-gold)] rounded-full" />
              )}
            </button>
            <button
              onClick={() => setTab('likes')}
              className={`flex-1 py-3 relative ${
                tab === 'likes' ? 'font-semibold' : 'text-[var(--text-muted)]'
              }`}
            >
              Likes
              {tab === 'likes' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-[var(--nu-gold)] rounded-full" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Tweet List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--nu-purple)]" />
        </div>
      ) : tweets.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-[var(--text-muted)]">
            {tab === 'tweets' ? 'No tweets yet' : 'No liked tweets yet'}
          </p>
        </div>
      ) : (
        tweets.map((tweet) => (
          <TweetCard
            key={tweet.id}
            tweet={tweet}
            onQuote={(t) => setQuoteTweet(t)}
            onDelete={loadProfile}
          />
        ))
      )}

      {showEditModal && (
        <EditProfileModal onClose={() => {
          setShowEditModal(false);
          loadProfile();
        }} />
      )}

      {quoteTweet && (
        <ComposeModal
          quotedTweet={quoteTweet}
          onClose={() => setQuoteTweet(null)}
          onSuccess={loadProfile}
        />
      )}
    </>
  );
};
