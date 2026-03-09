import { useAuth } from '../context/AuthContext';

export function ComposeBox({ onCompose }) {
  const { user } = useAuth();

  return (
    <div className="compose-box" onClick={onCompose}>
      <div className="compose-box-avatar">
        {(user?.profile_picture_url || user?.profile_pic_url) ? (
          <img src={user.profile_picture_url || user.profile_pic_url} alt="" />
        ) : (
          (user?.username || '?').charAt(0).toUpperCase()
        )}
      </div>
      <div className="compose-box-main">
        <div className="compose-box-placeholder">What's happening?</div>
        <div className="compose-box-reply">Everyone can reply</div>
        <div className="compose-box-actions">
          <div className="compose-box-icons">
            <span className="compose-icon" title="Media">📷</span>
            <span className="compose-icon" title="GIF">🎬</span>
            <span className="compose-icon" title="Poll">📊</span>
            <span className="compose-icon" title="Schedule">📅</span>
          </div>
          <div className="compose-box-buttons">
            <button
              type="button"
              className="compose-plus-btn"
              onClick={(e) => { e.stopPropagation(); onCompose(); }}
              aria-label="Compose tweet"
              title="New tweet"
            >
              <span className="compose-plus-sign">+</span>
            </button>
            <button
              type="button"
              className="compose-tweet-btn"
              onClick={(e) => { e.stopPropagation(); onCompose(); }}
            >
              Tweet
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
