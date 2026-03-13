import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';
import { AuthModal } from './components/AuthModal';
import { ComposeModal } from './components/ComposeModal';
import { SearchBar } from './components/SearchBar';
import { Feed } from './pages/Feed';
import { Profile } from './pages/Profile';
import './App.css';

function AppLayout() {
  const { user, loading } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [showCompose, setShowCompose] = useState(false);

  if (loading) {
    return (
      <div className="auth-gate">
        <div className="auth-gate-content">
          <div className="loading">Loading...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="auth-gate">
        <div className="auth-gate-content">
          <h1>𝕏</h1>
          <p>Sign in to see tweets and join the conversation.</p>
          <button className="btn btn-primary" onClick={() => setShowAuth(true)}>
            Sign in
          </button>
        </div>
        {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
      </div>
    );
  }

  return (
    <div className="app">
      <Sidebar
        onCompose={() => setShowCompose(true)}
        onAuth={() => setShowAuth(true)}
      />
      <main className="main">
        <Routes>
          <Route path="/" element={<Feed onCompose={() => setShowCompose(true)} />} />
          <Route path="/profile" element={<Navigate to={`/profile/${user.username}`} replace />} />
          <Route path="/profile/:username" element={<Profile />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <aside className="right-panel">
        <SearchBar />
      </aside>
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
      {showCompose && (
        <ComposeModal
          onClose={() => setShowCompose(false)}
          onPosted={() => window.dispatchEvent(new Event('feed-refresh'))}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppLayout />
      </AuthProvider>
    </BrowserRouter>
  );
}
