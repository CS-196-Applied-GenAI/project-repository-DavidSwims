import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { mockApiUpdateProfile } from '../utils/mockApi';

interface EditProfileModalProps {
  onClose: () => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ onClose }) => {
  const { user, token, updateUser } = useAuth();
  const [username, setUsername] = useState(user?.username || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [profilePicUrl, setProfilePicUrl] = useState(user?.profile_pic_url || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setLoading(true);
    setError('');

    try {
      const updatedUser = await mockApiUpdateProfile(token, {
        username,
        bio,
        profile_pic_url: profilePicUrl,
      });
      updateUser(updatedUser);
      onClose();
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)]">
          <h2 className="text-xl font-semibold">Edit Profile</h2>
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
              Display Name
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 border border-[var(--border-color)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--nu-purple)]"
              required
            />
          </div>

          <div>
            <label htmlFor="bio" className="block mb-2">
              Bio
            </label>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full px-4 py-2 border border-[var(--border-color)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--nu-purple)] resize-none"
              rows={3}
            />
          </div>

          <div>
            <label htmlFor="profilePic" className="block mb-2">
              Profile Picture URL
            </label>
            <input
              id="profilePic"
              type="url"
              value={profilePicUrl}
              onChange={(e) => setProfilePicUrl(e.target.value)}
              className="w-full px-4 py-2 border border-[var(--border-color)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--nu-purple)]"
              placeholder="https://example.com/image.jpg"
            />
            {profilePicUrl && (
              <div className="mt-2">
                <img
                  src={profilePicUrl}
                  alt="Preview"
                  className="w-20 h-20 rounded-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>

          {error && (
            <div className="text-[var(--error)] text-sm bg-red-50 p-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-2 border border-[var(--border-color)] text-[var(--text-primary)] rounded-full hover:bg-[var(--surface)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-2 bg-[var(--nu-purple)] text-white rounded-full hover:bg-[var(--nu-purple-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
