import React, { useState } from 'react';
import { X, Eye, EyeOff, Loader2 } from 'lucide-react';
import { mockApiLogin, mockApiRegister, mockApiCheckUsernameAvailability } from '../utils/mockApi';
import { useAuth } from '../contexts/AuthContext';

interface AuthModalProps {
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onClose }) => {
  const { login } = useAuth();
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);

  // Password strength calculator
  const calculatePasswordStrength = (pwd: string): number => {
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) strength++;
    if (/\d/.test(pwd)) strength++;
    if (/[^a-zA-Z0-9]/.test(pwd)) strength++;
    return strength;
  };

  const passwordStrength = calculatePasswordStrength(password);
  const strengthLabels = ['Too weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500'];

  // Debounced username availability check
  React.useEffect(() => {
    if (tab === 'register' && username.length > 0) {
      setCheckingUsername(true);
      const timer = setTimeout(() => {
        mockApiCheckUsernameAvailability(username).then(available => {
          setUsernameAvailable(available);
          setCheckingUsername(false);
        });
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setUsernameAvailable(null);
    }
  }, [username, tab]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (tab === 'login') {
        const response = await mockApiLogin(username, password);
        login(response.token, response.user);
        onClose();
      } else {
        if (!usernameAvailable) {
          setError('Username is already taken');
          setLoading(false);
          return;
        }
        const response = await mockApiRegister(username, email, password);
        login(response.token, response.user);
        onClose();
      }
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--border-color)]">
          <div className="flex gap-4">
            <button
              onClick={() => setTab('login')}
              className={`pb-2 transition-all ${
                tab === 'login'
                  ? 'border-b-2 border-[var(--nu-gold)] font-semibold'
                  : 'text-[var(--text-muted)]'
              }`}
            >
              Log in
            </button>
            <button
              onClick={() => setTab('register')}
              className={`pb-2 transition-all ${
                tab === 'register'
                  ? 'border-b-2 border-[var(--nu-gold)] font-semibold'
                  : 'text-[var(--text-muted)]'
              }`}
            >
              Create account
            </button>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--surface)] rounded-full transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="username" className="block mb-2">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 border border-[var(--border-color)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--nu-purple)]"
              required
            />
            {tab === 'register' && username.length > 0 && (
              <div className="mt-2 text-sm">
                {checkingUsername ? (
                  <span className="text-[var(--text-muted)]">Checking...</span>
                ) : usernameAvailable ? (
                  <span className="text-[var(--success)]">✓ Available</span>
                ) : (
                  <span className="text-[var(--error)]">✗ Taken</span>
                )}
              </div>
            )}
          </div>

          {tab === 'register' && (
            <div>
              <label htmlFor="email" className="block mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-[var(--border-color)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--nu-purple)]"
                required
              />
            </div>
          )}

          <div>
            <label htmlFor="password" className="block mb-2">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 pr-12 border border-[var(--border-color)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--nu-purple)]"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {tab === 'register' && password.length > 0 && (
              <div className="mt-2">
                <div className="flex gap-1 mb-1">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded ${
                        i < passwordStrength ? strengthColors[passwordStrength - 1] : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-sm text-[var(--text-muted)]">
                  {passwordStrength > 0 ? strengthLabels[passwordStrength - 1] : 'Too weak'}
                </p>
              </div>
            )}
          </div>

          {error && (
            <div className="text-[var(--error)] text-sm bg-red-50 p-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || (tab === 'register' && !usernameAvailable)}
            className="w-full py-3 bg-[var(--nu-purple)] text-white rounded-full hover:bg-[var(--nu-purple-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              tab === 'login' ? 'Log in' : 'Create account'
            )}
          </button>

          {tab === 'login' && (
            <p className="text-sm text-center text-[var(--text-muted)]">
              Demo credentials: wildcatfan / password
            </p>
          )}
        </form>
      </div>
    </div>
  );
};
