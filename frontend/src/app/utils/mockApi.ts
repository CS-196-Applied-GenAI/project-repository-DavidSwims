export interface User {
  id: number;
  username: string;
  email: string;
  bio: string;
  profile_pic_url: string;
  created_at: string;
  followers_count?: number;
  following_count?: number;
}

export interface Tweet {
  id: number;
  user_id: number;
  username: string;
  content: string;
  parent_tweet_id: number | null;
  quoted_tweet_id: number | null;
  created_at: string;
  like_count: number;
  retweet_count: number;
  is_retweet: boolean;
  original_user?: string;
  user?: User;
  quoted_tweet?: Tweet | null;
  deleted?: boolean;
}

export interface AuthResponse {
  token: string;
  user: User;
}

const API_BASE = '/api';

function getToken(): string | null {
  return localStorage.getItem('token');
}

function getHeaders(auth = false): HeadersInit {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(auth && token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  auth = false
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...getHeaders(auth),
      ...(options.headers || {}),
    },
  });

  if (res.status === 204) {
    return undefined as T;
  }

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Request failed');
  }

  return data as T;
}

function normalizeUser(raw: Partial<User>): User {
  return {
    id: raw.id || 0,
    username: raw.username || '',
    email: raw.email || '',
    bio: raw.bio || '',
    profile_pic_url: raw.profile_pic_url || '',
    created_at: raw.created_at || new Date().toISOString(),
    followers_count: Number(raw.followers_count || 0),
    following_count: Number(raw.following_count || 0),
  };
}

function normalizeTweet(raw: any): Tweet {
  return {
    id: raw.id,
    user_id: raw.user_id,
    username: raw.username || raw.user?.username || 'unknown',
    content: raw.content || '',
    parent_tweet_id: raw.parent_tweet_id ?? null,
    quoted_tweet_id: raw.quoted_tweet_id ?? null,
    created_at: raw.created_at,
    like_count: raw.like_count ?? 0,
    retweet_count: raw.retweet_count ?? 0,
    is_retweet: raw.is_retweet ?? false,
    original_user: raw.original_user,
    user: raw.user ? normalizeUser(raw.user) : undefined,
    quoted_tweet: raw.quoted_tweet ? normalizeTweet(raw.quoted_tweet) : null,
    deleted: raw.deleted,
  };
}

// No-op now that we use real backend data.
export const initializeMockData = () => {};

export const mockApiLogin = async (
  username: string,
  password: string
): Promise<AuthResponse> => {
  const data = await request<{ token: string; user: User }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });

  return {
    token: data.token,
    user: normalizeUser(data.user),
  };
};

export const mockApiRegister = async (
  username: string,
  email: string,
  password: string
): Promise<AuthResponse> => {
  await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, email, password }),
  });

  // Backend register route does not return a token, so log in after successful register.
  return mockApiLogin(username, password);
};

export const mockApiGetCurrentUser = async (_token: string): Promise<User> => {
  const data = await request<User>('/auth/me', {}, true);
  return normalizeUser(data);
};

export const mockApiUpdateProfile = async (
  _token: string,
  updates: Partial<User>
): Promise<User> => {
  const payload: Partial<User> = {
    ...(updates.username !== undefined ? { username: updates.username } : {}),
    ...(updates.bio !== undefined ? { bio: updates.bio } : {}),
    ...(updates.profile_pic_url !== undefined
      ? { profile_pic_url: updates.profile_pic_url }
      : {}),
  };

  const data = await request<User>('/users/me', {
    method: 'PUT',
    body: JSON.stringify(payload),
  }, true);

  return normalizeUser(data);
};

export const mockApiGetFeed = async (
  limit: number = 20,
  offset: number = 0
): Promise<Tweet[]> => {
  const data = await request<{ tweets: any[] }>(
    `/feed?limit=${limit}&offset=${offset}`,
    {},
    true
  );

  return (data.tweets || []).map(normalizeTweet);
};

export const mockApiPostTweet = async (
  _token: string,
  content: string,
  quotedTweetId?: number
): Promise<Tweet> => {
  const data = await request<any>(
    '/tweets',
    {
      method: 'POST',
      body: JSON.stringify({
        content,
        parent_tweet_id: quotedTweetId || null,
      }),
    },
    true
  );

  return normalizeTweet(data);
};

export const mockApiDeleteTweet = async (
  _token: string,
  tweetId: number
): Promise<void> => {
  await request<void>(`/tweets/${tweetId}`, { method: 'DELETE' }, true);
};

export const mockApiToggleLike = async (
  _token: string,
  tweetId: number
): Promise<{ liked: boolean }> => {
  return request<{ liked: boolean }>(`/tweets/${tweetId}/like`, { method: 'POST' }, true);
};

export const mockApiToggleRetweet = async (
  _token: string,
  tweetId: number
): Promise<{ retweeted: boolean }> => {
  return request<{ retweeted: boolean }>(
    `/tweets/${tweetId}/retweet`,
    { method: 'POST' },
    true
  );
};

export const mockApiGetUserProfile = async (
  username: string,
  tab: 'tweets' | 'likes' = 'tweets'
): Promise<{ user: User; tweets: Tweet[] }> => {
  const data = await request<any>(`/users/${username}?tab=${tab}`, {}, true);
  const user = normalizeUser(data);
  const tweets = ((tab === 'likes' ? data.likes : data.tweets) || []).map(normalizeTweet);
  return { user, tweets };
};

export const mockApiSearchUsers = async (query: string): Promise<User[]> => {
  if (!query) return [];
  const data = await request<{ users: User[] }>(
    `/users/search/query?q=${encodeURIComponent(query)}`
  );
  return (data.users || []).map(normalizeUser);
};

export const mockApiCheckUsernameAvailability = async (
  username: string
): Promise<boolean> => {
  if (!username.trim()) return false;

  try {
    const data = await request<{ available: boolean }>(
      `/users/check-username?username=${encodeURIComponent(username)}`
    );
    return data.available;
  } catch {
    const users = await mockApiSearchUsers(username);
    return !users.some((u) => u.username.toLowerCase() === username.toLowerCase());
  }
};

export const mockApiToggleFollow = async (
  _token: string,
  targetUserId: number
): Promise<{ following: boolean }> => {
  return request<{ following: boolean }>(
    `/users/${targetUserId}/follow`,
    { method: 'POST' },
    true
  );
};

export const mockApiToggleBlock = async (
  _token: string,
  targetUserId: number
): Promise<{ blocked: boolean }> => {
  return request<{ blocked: boolean }>(
    `/users/${targetUserId}/block`,
    { method: 'POST' },
    true
  );
};

export const mockApiGetRelationship = async (
  _token: string,
  targetUserId: number
): Promise<{ following: boolean; blocked: boolean }> => {
  return request<{ following: boolean; blocked: boolean }>(
    `/users/${targetUserId}/relationship`,
    {},
    true
  );
};

// Feed payload currently does not include per-user liked/retweeted flags.
export const mockApiGetLikeStatus = (_token: string, _tweetId: number): boolean => false;
export const mockApiGetRetweetStatus = (_token: string, _tweetId: number): boolean => false;
