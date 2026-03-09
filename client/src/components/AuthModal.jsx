import { useState, useCallback } from 'react';
import { register, login, checkUsername } from '../api';
import { useAuth } from '../context/AuthContext';

function passwordStrength(pwd) {
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score++;
  if (/\d/.test(pwd)) score++;
  if (/[^a-zA-Z0-9]/.test(pwd)) score++;
  return score;
}

export function AuthModal({ onClose }) {
  const { login: doLogin } = useAuth();
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const [usernameCheckTimer, setUsernameCheckTimer] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const checkUsernameDebounced = useCallback((val) => {
    if (usernameCheckTimer) clearTimeout(usernameCheckTimer);
    if (!val || val.length < 3) {
      setUsernameAvailable(null);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const { available } = await checkUsername(val);
        setUsernameAvailable(available);
      } catch {
        setUsernameAvailable(null);
      }
    }, 300);
    setUsernameCheckTimer(t);
  }, [usernameCheckTimer]);

  const handleUsernameChange = (e) => {
    const val = e.target.value.replace(/[^a-zA-Z0-9_]/g, '');
    setUsername(val);
    setError('');
    if (mode === 'register') checkUsernameDebounced(val);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        const { token, user } = await login(username, password);
        doLogin(token, user);
      } else {
        if (usernameAvailable === false) {
          setError('Username is not available');
          setLoading(false);
          return;
        }
        await register({ username, email, password });
        const { token, user } = await login(username, password);
        doLogin(token, user);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const strength = passwordStrength(password);
  const strengthColors = ['', '#dc2626', '#f59e0b', '#22c55e', '#16a34a'];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{mode === 'login' ? 'Log in' : 'Create account'}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">&times;</button>
        </div>
        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Username</label>
              <input
                className="form-input"
                type="text"
                value={username}
                onChange={handleUsernameChange}
                placeholder="@username"
                required
                autoComplete="username"
              />
              {mode === 'register' && username.length >= 3 && usernameAvailable !== null && (
                <div className="form-error" style={{ color: usernameAvailable ? '#16a34a' : 'inherit' }}>
                  {usernameAvailable ? 'Username is available' : 'Username is taken'}
                </div>
              )}
            </div>
            {mode === 'register' && (
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  className="form-input"
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                />
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="password-input-wrap">
                <input
                  className="form-input"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  placeholder="••••••••"
                  required
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  )}
                </button>
              </div>
              {mode === 'register' && password && (
                <div className="password-strength">
                  <div
                    className="password-strength-bar"
                    style={{ width: `${(strength / 4) * 100}%`, background: strengthColors[strength] }}
                  />
                </div>
              )}
            </div>
            {error && <div className="form-error">{error}</div>}
            <button type="submit" className="btn btn-primary" style={{ marginTop: 16 }} disabled={loading}>
              {loading ? 'Please wait...' : mode === 'login' ? 'Log in' : 'Sign up'}
            </button>
          </form>
          <div className="switch-auth">
            {mode === 'login' ? (
              <>Don't have an account? <button type="button" onClick={() => { setMode('register'); setError(''); }}>Sign up</button></>
            ) : (
              <>Already have an account? <button type="button" onClick={() => { setMode('login'); setError(''); }}>Log in</button></>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
