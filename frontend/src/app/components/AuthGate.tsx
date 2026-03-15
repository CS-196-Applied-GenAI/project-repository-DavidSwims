import React, { useState } from 'react';
import { AuthModal } from './AuthModal';

export const AuthGate: React.FC = () => {
  const [showAuthModal, setShowAuthModal] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--nu-purple)] via-purple-700 to-[var(--nu-purple-hover)] flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="bg-white/10 backdrop-blur-md rounded-3xl p-12 border border-white/20">
          <div className="flex items-center justify-center gap-3 mb-6">
            <span className="text-6xl">🐾</span>
            <h1 className="text-5xl font-bold text-white">Wildcat</h1>
          </div>
          
          <p className="text-xl text-white/90 mb-8">
            The Northwestern community, in real time.
          </p>

          <button
            onClick={() => setShowAuthModal(true)}
            className="w-full px-8 py-4 bg-white text-[var(--nu-purple)] rounded-full text-lg font-semibold hover:bg-white/90 transition-colors"
          >
            Sign in
          </button>
        </div>
      </div>

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
    </div>
  );
};
