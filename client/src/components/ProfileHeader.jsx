import { useAuth } from '../context/AuthContext';

export function ProfileHeader({ user: profileUser, tweetCount, likeCount }) {
  const { user } = useAuth();
  const u = profileUser || user;
  if (!u) return null;

  return (
    <div className="profile-header">
      <div className="profile-avatar">
        {(u.profile_picture_url || u.profile_pic_url) ? (
          <img src={u.profile_picture_url || u.profile_pic_url} alt="" />
        ) : (
          (u.display_name || u.username || '?').charAt(0).toUpperCase()
        )}
      </div>
      <div className="profile-name">{u.display_name || u.username}</div>
      <div className="profile-username">@{u.username}</div>
      {u.bio && <div className="profile-bio">{u.bio}</div>}
      <div className="profile-stats">
        <span><span>{tweetCount ?? '-'}</span> Tweets</span>
        <span><span>{u.followers_count ?? 0}</span> Followers</span>
        <span><span>{u.following_count ?? 0}</span> Following</span>
        <span><span>{likeCount ?? '-'}</span> Likes</span>
      </div>
    </div>
  );
}
