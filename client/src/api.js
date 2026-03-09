const API_BASE = '/api';

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

export async function register({ username, email, password }) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Registration failed');
  return data;
}

export async function login(username, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Login failed');
  return data;
}

export async function getMe() {
  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: getAuthHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to get user');
  return data;
}

export async function getFeed(limit = 20, offset = 0) {
  const res = await fetch(
    `${API_BASE}/feed?limit=${limit}&offset=${offset}`,
    { headers: getAuthHeaders() }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to get feed');
  return data;
}

export async function createTweet({ text, parent_tweet_id }) {
  const res = await fetch(`${API_BASE}/tweets`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ content: text, parent_tweet_id: parent_tweet_id || null }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to create tweet');
  return data;
}

export async function deleteTweet(id) {
  const res = await fetch(`${API_BASE}/tweets/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (res.status === 204) return;
  const data = await res.json();
  throw new Error(data.error || 'Failed to delete tweet');
}

export async function likeTweet(id) {
  const res = await fetch(`${API_BASE}/tweets/${id}/like`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to like');
  return data;
}

export async function retweetTweet(id) {
  const res = await fetch(`${API_BASE}/tweets/${id}/retweet`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to retweet');
  return data;
}

export async function followUser(id) {
  const res = await fetch(`${API_BASE}/users/${id}/follow`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to follow');
  return data;
}

export async function getUser(username, tab = 'tweets') {
  const res = await fetch(`${API_BASE}/users/${username}?tab=${tab}`, {
    headers: getAuthHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'User not found');
  return data;
}

export async function searchUsers(q) {
  const res = await fetch(`${API_BASE}/users/search/query?q=${encodeURIComponent(q)}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Search failed');
  return data;
}

export async function checkUsername(username) {
  const data = await searchUsers(username);
  const users = data.users || [];
  const available = !users.some((u) => u.username.toLowerCase() === username.toLowerCase());
  return { available };
}
