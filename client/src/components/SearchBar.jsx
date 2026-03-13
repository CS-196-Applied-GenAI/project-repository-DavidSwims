import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { searchUsers } from '../api';

export function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [debounced, setDebounced] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  const fetchResults = useCallback(async () => {
    if (!debounced.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const users = await searchUsers(debounced);
      setResults(users);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [debounced]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  return (
    <div>
      <input
        className="search-box"
        type="text"
        placeholder="Search users"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {query && (
        <div className="search-results">
          {loading ? (
            <div className="loading" style={{ padding: 16 }}>Searching...</div>
          ) : results.length === 0 ? (
            <div style={{ padding: 16, color: 'var(--gray-500)' }}>No users found</div>
          ) : (
            results.map((u) => (
              <Link
                key={u.id}
                to={`/profile/${u.username}`}
                className="search-user"
                onClick={() => setQuery('')}
              >
                <div
                  className="tweet-avatar"
                  style={{ width: 40, height: 40, fontSize: 16 }}
                >
                  {(u.profile_picture_url || u.profile_pic_url) ? (
                    <img src={u.profile_picture_url || u.profile_pic_url} alt="" />
                  ) : (
                    (u.display_name || u.username || '?').charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <div style={{ fontWeight: 700 }}>{u.display_name || u.username}</div>
                  <div style={{ color: 'var(--gray-500)', fontSize: 14 }}>@{u.username}</div>
                </div>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}
