import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function Sidebar({ onCompose, onAuth }) {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Home', icon: '🏠' },
    { path: '/profile', label: 'Profile', icon: '👤' },
  ];

  return (
    <aside className="sidebar">
      <Link to="/" className="logo">𝕏</Link>
      {navItems.map(({ path, label, icon }) => (
        <Link
          key={path}
          to={path}
          className={`nav-btn ${location.pathname === path || (path === '/profile' && location.pathname.startsWith('/profile')) ? 'active' : ''}`}
        >
          <span>{icon}</span>
          <span>{label}</span>
        </Link>
      ))}
      <button className="nav-btn post-btn" onClick={user ? onCompose : onAuth}>
        Post
      </button>
      {user && (
        <button className="nav-btn" onClick={logout} style={{ marginTop: 'auto' }}>
          <span>🚪</span>
          <span>Log out</span>
        </button>
      )}
    </aside>
  );
}
