import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { Link } from 'react-router';
import { mockApiSearchUsers, User } from '../utils/mockApi';

export const RightPanel: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (searchQuery.length === 0) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(() => {
      mockApiSearchUsers(searchQuery).then(setSearchResults);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const getAvatarContent = (user: User) => {
    if (user.profile_pic_url) {
      return <img src={user.profile_pic_url} alt={user.username} className="w-10 h-10 rounded-full object-cover" />;
    }
    return (
      <div className="w-10 h-10 rounded-full bg-[var(--nu-purple)] text-white flex items-center justify-center font-semibold">
        {user.username[0].toUpperCase()}
      </div>
    );
  };

  return (
    <div className="w-[350px] h-screen sticky top-0 p-4">
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setShowResults(true)}
            placeholder="Search users"
            className="w-full pl-12 pr-4 py-3 bg-[var(--surface)] rounded-full focus:outline-none focus:ring-2 focus:ring-[var(--nu-purple)]"
          />
        </div>

        {showResults && searchQuery.length > 0 && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setShowResults(false)}
            />
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-[var(--border-color)] rounded-xl shadow-lg z-20 max-h-[400px] overflow-y-auto">
              {searchResults.length > 0 ? (
                searchResults.map((user) => (
                  <Link
                    key={user.id}
                    to={`/profile/${user.username}`}
                    onClick={() => {
                      setShowResults(false);
                      setSearchQuery('');
                    }}
                    className="flex items-center gap-3 p-4 hover:bg-[var(--surface)] transition-colors border-b border-[var(--border-color)] last:border-b-0"
                  >
                    {getAvatarContent(user)}
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate">{user.username}</div>
                      <div className="text-sm text-[var(--text-muted)] truncate">@{user.username}</div>
                      {user.bio && (
                        <div className="text-sm text-[var(--text-muted)] truncate">{user.bio}</div>
                      )}
                    </div>
                  </Link>
                ))
              ) : (
                <div className="p-4 text-center text-[var(--text-muted)]">
                  No users found
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
