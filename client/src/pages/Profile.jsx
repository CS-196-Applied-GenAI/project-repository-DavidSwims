import { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { getUser } from '../api';
import { TweetCard } from '../components/TweetCard';
import { ProfileHeader } from '../components/ProfileHeader';

function normalizeTweet(t, author) {
  return {
    id: t.id,
    text: t.content || t.text,
    author: author || { username: '?', display_name: '?' },
    created_at: t.created_at,
    like_count: t.like_count ?? 0,
    retweet_count: t.retweet_count ?? 0,
    liked_by_me: t.liked_by_me ?? false,
    retweeted_by_me: t.retweeted_by_me ?? false,
    quoted_tweet: t.quoted_tweet,
  };
}

export function Profile() {
  const { username } = useParams();
  const [searchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'tweets';
  const [user, setUser] = useState(null);
  const [tweets, setTweets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!username) return;
    setLoading(true);
    getUser(username, tab)
      .then((data) => {
        const u = {
          id: data.id,
          username: data.username,
          display_name: data.username,
          bio: data.bio,
          profile_picture_url: data.profile_pic_url,
          followers_count: data.followers_count,
          following_count: data.following_count,
        };
        setUser(u);
        const list = (data.tweets || data.likes || []).map((t) =>
          normalizeTweet(t, u)
        );
        setTweets(list);
      })
      .catch((err) => setError(err.message || 'Failed to load profile'))
      .finally(() => setLoading(false));
  }, [username, tab]);

  if (loading && !user) {
    return <div className="loading">Loading profile...</div>;
  }

  if (error && !user) {
    return <div className="error-msg">{error}</div>;
  }

  const tweetCount = tab === 'tweets' ? tweets.length : undefined;
  const likeCount = tab === 'likes' ? tweets.length : undefined;

  return (
    <>
      <div className="feed-header">Profile</div>
      <ProfileHeader user={user} tweetCount={tweetCount} likeCount={likeCount} />
      <div className="tab-buttons">
        <Link
          to={`/profile/${username}?tab=tweets`}
          className={`tab-btn ${tab === 'tweets' ? 'active' : ''}`}
        >
          Tweets
        </Link>
        <Link
          to={`/profile/${username}?tab=likes`}
          className={`tab-btn ${tab === 'likes' ? 'active' : ''}`}
        >
          Likes
        </Link>
      </div>
      <div className="feed-content">
        {tweets.map((t) => (
          <TweetCard key={t.id} tweet={t} />
        ))}
        {!loading && tweets.length === 0 && (
          <div className="loading">No {tab} yet.</div>
        )}
      </div>
    </>
  );
}
