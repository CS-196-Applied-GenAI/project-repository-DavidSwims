import React, { useState } from 'react';
import { Home, User, LogOut, Edit3 } from 'lucide-react';
import { Link, useLocation } from 'react-router';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
  onCompose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onCompose }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [showLogout, setShowLogout] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const getAvatarContent = () => {
    if (user?.profile_pic_url) {
      return <img src={user.profile_pic_url} alt={user.username} className="w-10 h-10 rounded-full object-cover" />;
    }
    return (
      <div className="w-10 h-10 rounded-full bg-[var(--nu-purple)] text-white flex items-center justify-center font-semibold">
        {user?.username[0].toUpperCase()}
      </div>
    );
  };

  return (
    <div className="w-[275px] h-screen sticky top-0 flex flex-col border-r border-[var(--border-color)] p-4">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2 mb-8 p-2">
        <span className="text-2xl">🐾</span>
        <span className="text-2xl font-bold" style={{ color: 'var(--nu-purple)' }}>
          Wildcatwitter
        </span>
      </Link>

      {/* Navigation */}
      <nav className="flex-1 space-y-2">
        <Link
          to="/"
          className={`flex items-center gap-4 px-4 py-3 rounded-full transition-colors ${
            isActive('/')
              ? 'bg-[var(--nu-purple-light)] text-[var(--nu-purple)]'
              : 'hover:bg-[var(--nu-purple-light)]'
          }`}
        >
          <Home className="w-6 h-6" />
          <span className="text-lg">Home</span>
        </Link>

        <Link
          to={`/profile/${user?.username}`}
          className={`flex items-center gap-4 px-4 py-3 rounded-full transition-colors ${
            isActive(`/profile/${user?.username}`)
              ? 'bg-[var(--nu-purple-light)] text-[var(--nu-purple)]'
              : 'hover:bg-[var(--nu-purple-light)]'
          }`}
        >
          <User className="w-6 h-6" />
          <span className="text-lg">Profile</span>
        </Link>

        <button
          onClick={onCompose}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[var(--nu-purple)] text-white rounded-full hover:bg-[var(--nu-purple-hover)] transition-colors mt-4"
        >
          <Edit3 className="w-5 h-5" />
          <span className="text-lg">Post</span>
        </button>
      </nav>

      {/* User Profile */}
      <div className="relative">
        <button
          onClick={() => setShowLogout(!showLogout)}
          className="w-full flex items-center gap-3 p-3 hover:bg-[var(--surface)] rounded-full transition-colors"
        >
          {getAvatarContent()}
          <div className="flex-1 text-left min-w-0">
            <div className="font-semibold truncate">{user?.username}</div>
            <div className="text-sm text-[var(--text-muted)] truncate">@{user?.username}</div>
          </div>
        </button>

        {showLogout && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowLogout(false)} />
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-[var(--border-color)] rounded-xl shadow-lg z-20">
              <button
                onClick={() => {
                  logout();
                  setShowLogout(false);
                }}
                className="w-full px-4 py-3 text-left hover:bg-[var(--surface)] flex items-center gap-3 rounded-xl"
              >
                <LogOut className="w-5 h-5" />
                <span>Log out @{user?.username}</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
