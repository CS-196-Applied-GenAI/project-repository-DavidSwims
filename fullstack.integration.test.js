const request = require('supertest');

let state;
let ids;

function resetState() {
  ids = {
    user: 2,
    tweet: 1,
    like: 0,
    retweet: 0,
    follow: 0,
    block: 0,
  };

  state = {
    users: [
      {
        id: 1,
        username: 'alice',
        email: 'alice@example.com',
        password_hash: 'hashed:Password123!',
        bio: '',
        profile_pic_url: '',
      },
      {
        id: 2,
        username: 'bob',
        email: 'bob@example.com',
        password_hash: 'hashed:Password123!',
        bio: '',
        profile_pic_url: '',
      },
    ],
    tweets: [
      {
        id: 1,
        user_id: 2,
        content: 'hello from bob',
        parent_tweet_id: null,
        created_at: '2026-03-15T09:00:00.000Z',
      },
    ],
    likes: [],
    retweets: [],
    follows: [],
    blocks: [],
  };
}

resetState();

const mockPoolQuery = jest.fn(async (sql, params = []) => {
  if (sql.includes('SELECT 1 + 1 AS result')) return [[{ result: 2 }]];

  if (sql.includes('SELECT id FROM users WHERE username = ?')) {
    const username = params[0];
    return [state.users.filter((u) => u.username === username).map((u) => ({ id: u.id }))];
  }

  if (sql.includes('INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)')) {
    const [username, email, passwordHash] = params;
    const user = {
      id: ++ids.user,
      username,
      email,
      password_hash: passwordHash,
      bio: '',
      profile_pic_url: '',
    };
    state.users.push(user);
    return [{ insertId: user.id }];
  }

  if (sql.includes('SELECT id, username, email, password_hash FROM users WHERE username = ?')) {
    const username = params[0];
    const user = state.users.find((u) => u.username === username);
    return [user ? [user] : []];
  }

  if (sql.includes('SELECT id, username, email, bio, profile_pic_url FROM users WHERE id = ?')) {
    const id = Number(params[0]);
    const user = state.users.find((u) => u.id === id);
    if (!user) return [[]];
    return [[{
      id: user.id,
      username: user.username,
      email: user.email,
      bio: user.bio,
      profile_pic_url: user.profile_pic_url,
    }]];
  }

  if (sql.includes('UPDATE users SET')) {
    const userId = Number(params[params.length - 1]);
    const user = state.users.find((u) => u.id === userId);
    const setClause = sql.split('SET')[1].split('WHERE')[0].trim();
    const fields = setClause.split(',').map((f) => f.trim().replace(' = ?', ''));

    fields.forEach((field, idx) => {
      user[field] = params[idx];
    });

    return [{}];
  }

  if (sql.includes('FROM users u') && sql.includes('WHERE u.username = ?')) {
    const username = params[0];
    const user = state.users.find((u) => u.username === username);
    if (!user) return [[]];

    const followersCount = state.follows.filter((f) => f.following_id === user.id).length;
    const followingCount = state.follows.filter((f) => f.follower_id === user.id).length;

    return [[{
      id: user.id,
      username: user.username,
      email: user.email,
      bio: user.bio,
      profile_pic_url: user.profile_pic_url,
      followers_count: followersCount,
      following_count: followingCount,
    }]];
  }

  if (sql.includes('SELECT id, username, email, bio, profile_pic_url FROM users WHERE username LIKE ?')) {
    const like = params[0].replace(/%/g, '').toLowerCase();
    const limit = Number(params[1]);
    const offset = Number(params[2]);
    const users = state.users
      .filter((u) => u.username.toLowerCase().includes(like))
      .slice(offset, offset + limit)
      .map((u) => ({
        id: u.id,
        username: u.username,
        email: u.email,
        bio: u.bio,
        profile_pic_url: u.profile_pic_url,
      }));
    return [users];
  }

  if (sql.includes('INSERT INTO tweets (user_id, content, parent_tweet_id) VALUES (?, ?, ?)')) {
    const [userId, content, parentTweetId] = params;
    const tweet = {
      id: ++ids.tweet,
      user_id: Number(userId),
      content,
      parent_tweet_id: parentTweetId,
      created_at: new Date().toISOString(),
    };
    state.tweets.push(tweet);
    return [{ insertId: tweet.id }];
  }

  if (sql.includes('SELECT id, user_id FROM tweets WHERE id = ?')) {
    const id = Number(params[0]);
    const tweet = state.tweets.find((t) => t.id === id);
    return [tweet ? [{ id: tweet.id, user_id: tweet.user_id }] : []];
  }

  if (sql.includes('DELETE FROM tweets WHERE id = ?')) {
    const id = Number(params[0]);
    state.tweets = state.tweets.filter((t) => t.id !== id);
    return [{}];
  }

  if (sql.includes('SELECT id FROM likes WHERE user_id = ? AND tweet_id = ?')) {
    const [userId, tweetId] = params.map(Number);
    const found = state.likes.find((l) => l.user_id === userId && l.tweet_id === tweetId);
    return [found ? [{ id: found.id }] : []];
  }

  if (sql.includes('INSERT INTO likes (user_id, tweet_id) VALUES (?, ?)')) {
    const [userId, tweetId] = params.map(Number);
    state.likes.push({ id: ++ids.like, user_id: userId, tweet_id: tweetId, created_at: new Date().toISOString() });
    return [{}];
  }

  if (sql.includes('DELETE FROM likes WHERE user_id = ? AND tweet_id = ?')) {
    const [userId, tweetId] = params.map(Number);
    state.likes = state.likes.filter((l) => !(l.user_id === userId && l.tweet_id === tweetId));
    return [{}];
  }

  if (sql.includes('SELECT id FROM retweets WHERE user_id = ? AND tweet_id = ?')) {
    const [userId, tweetId] = params.map(Number);
    const found = state.retweets.find((r) => r.user_id === userId && r.tweet_id === tweetId);
    return [found ? [{ id: found.id }] : []];
  }

  if (sql.includes('INSERT INTO retweets (user_id, tweet_id) VALUES (?, ?)')) {
    const [userId, tweetId] = params.map(Number);
    state.retweets.push({ id: ++ids.retweet, user_id: userId, tweet_id: tweetId });
    return [{}];
  }

  if (sql.includes('DELETE FROM retweets WHERE user_id = ? AND tweet_id = ?')) {
    const [userId, tweetId] = params.map(Number);
    state.retweets = state.retweets.filter((r) => !(r.user_id === userId && r.tweet_id === tweetId));
    return [{}];
  }

  if (sql.includes('SELECT id FROM follows WHERE follower_id = ? AND following_id = ?')) {
    const [followerId, followingId] = params.map(Number);
    const found = state.follows.find((f) => f.follower_id === followerId && f.following_id === followingId);
    return [found ? [{ id: found.id }] : []];
  }

  if (sql.includes('INSERT INTO follows (follower_id, following_id) VALUES (?, ?)')) {
    const [followerId, followingId] = params.map(Number);
    state.follows.push({ id: ++ids.follow, follower_id: followerId, following_id: followingId });
    return [{}];
  }

  if (sql.includes('DELETE FROM follows WHERE follower_id = ? AND following_id = ?')) {
    const [followerId, followingId] = params.map(Number);
    state.follows = state.follows.filter((f) => !(f.follower_id === followerId && f.following_id === followingId));
    return [{}];
  }

  if (sql.includes('DELETE FROM follows WHERE (follower_id = ? AND following_id = ?) OR (follower_id = ? AND following_id = ?)')) {
    const [a, b, c, d] = params.map(Number);
    state.follows = state.follows.filter(
      (f) => !((f.follower_id === a && f.following_id === b) || (f.follower_id === c && f.following_id === d))
    );
    return [{}];
  }

  if (sql.includes('SELECT id FROM blocks WHERE blocker_id = ? AND blocked_id = ?')) {
    const [blockerId, blockedId] = params.map(Number);
    const found = state.blocks.find((b) => b.blocker_id === blockerId && b.blocked_id === blockedId);
    return [found ? [{ id: found.id }] : []];
  }

  if (sql.includes('INSERT INTO blocks (blocker_id, blocked_id) VALUES (?, ?)')) {
    const [blockerId, blockedId] = params.map(Number);
    state.blocks.push({ id: ++ids.block, blocker_id: blockerId, blocked_id: blockedId });
    return [{}];
  }

  if (sql.includes('DELETE FROM blocks WHERE blocker_id = ? AND blocked_id = ?')) {
    const [blockerId, blockedId] = params.map(Number);
    state.blocks = state.blocks.filter((b) => !(b.blocker_id === blockerId && b.blocked_id === blockedId));
    return [{}];
  }

  if (sql.includes('SELECT id, user_id, content, parent_tweet_id, created_at FROM tweets WHERE user_id = ? ORDER BY created_at DESC')) {
    const userId = Number(params[0]);
    const rows = state.tweets
      .filter((t) => t.user_id === userId)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return [rows];
  }

  if (sql.includes('FROM tweets t') && sql.includes('INNER JOIN likes l ON t.id = l.tweet_id')) {
    const userId = Number(params[0]);
    const rows = state.likes
      .filter((l) => l.user_id === userId)
      .map((l) => state.tweets.find((t) => t.id === l.tweet_id))
      .filter(Boolean)
      .map((t) => ({
        id: t.id,
        user_id: t.user_id,
        content: t.content,
        parent_tweet_id: t.parent_tweet_id,
        created_at: t.created_at,
      }));
    return [rows];
  }

  if (sql.includes('FROM tweets t') && sql.includes('INNER JOIN follows f ON')) {
    const numericParams = params.map(Number);
    const userId = numericParams[2] ?? numericParams[0];
    const blockerIdA = numericParams[3] ?? userId;
    const blockerIdB = numericParams[4] ?? userId;
    const limit = numericParams[numericParams.length - 2];
    const offset = numericParams[numericParams.length - 1];
    const followedIds = new Set(
      state.follows.filter((f) => f.follower_id === userId).map((f) => f.following_id)
    );
    const blockedSet = new Set(
      state.blocks
        .filter((b) =>
          (b.blocker_id === blockerIdA) ||
          (b.blocked_id === blockerIdB)
        )
        .flatMap((b) => [b.blocker_id + ':' + b.blocked_id, b.blocked_id + ':' + b.blocker_id])
    );

    const rows = state.tweets
      .filter((t) => followedIds.has(t.user_id))
      .filter((t) => !blockedSet.has(`${userId}:${t.user_id}`))
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(offset, offset + limit)
      .map((t) => {
        const tweetLikes = state.likes.filter((l) => l.tweet_id === t.id).length;
        const tweetRetweets = state.retweets.filter((r) => r.tweet_id === t.id).length;
        const author = state.users.find((u) => u.id === t.user_id);
        return {
          ...t,
          username: author?.username || 'unknown',
          profile_pic_url: author?.profile_pic_url || '',
          like_count: tweetLikes,
          retweet_count: tweetRetweets,
          liked_by_me: state.likes.some((l) => l.tweet_id === t.id && l.user_id === userId),
          retweeted_by_me: state.retweets.some((r) => r.tweet_id === t.id && r.user_id === userId),
        };
      });

    return [rows];
  }

  if (sql.includes('FROM tweets t') && sql.includes('WHERE t.user_id NOT IN (SELECT following_id FROM follows WHERE follower_id = ?)')) {
    const numericParams = params.map(Number);
    const userId = numericParams[2] ?? numericParams[0];
    const blockerIdA = numericParams[3] ?? userId;
    const blockerIdB = numericParams[4] ?? userId;
    const limit = numericParams[numericParams.length - 2];
    const offset = numericParams[numericParams.length - 1];
    const followedIds = new Set(
      state.follows.filter((f) => f.follower_id === userId).map((f) => f.following_id)
    );
    const blockedSet = new Set(
      state.blocks
        .filter((b) =>
          (b.blocker_id === blockerIdA) ||
          (b.blocked_id === blockerIdB)
        )
        .flatMap((b) => [b.blocker_id + ':' + b.blocked_id, b.blocked_id + ':' + b.blocker_id])
    );

    const rows = state.tweets
      .filter((t) => !followedIds.has(t.user_id))
      .filter((t) => !blockedSet.has(`${userId}:${t.user_id}`))
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(offset, offset + limit)
      .map((t) => {
        const tweetLikes = state.likes.filter((l) => l.tweet_id === t.id).length;
        const tweetRetweets = state.retweets.filter((r) => r.tweet_id === t.id).length;
        const author = state.users.find((u) => u.id === t.user_id);
        return {
          ...t,
          username: author?.username || 'unknown',
          profile_pic_url: author?.profile_pic_url || '',
          like_count: tweetLikes,
          retweet_count: tweetRetweets,
          liked_by_me: state.likes.some((l) => l.tweet_id === t.id && l.user_id === userId),
          retweeted_by_me: state.retweets.some((r) => r.tweet_id === t.id && r.user_id === userId),
        };
      });

    return [rows];
  }

  throw new Error(`Unhandled SQL in integration mock: ${sql}`);
});

jest.mock('./backend/db', () => ({
  pool: { query: (...args) => mockPoolQuery(...args) },
  testConnection: jest.fn(async () => ({ success: true, result: 2 })),
}));

jest.mock('bcrypt', () => ({
  hash: jest.fn(async (pwd) => `hashed:${pwd}`),
  compare: jest.fn(async (pwd, hash) => hash === `hashed:${pwd}`),
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn((payload) => `token:${payload.id}:${payload.username}`),
  verify: jest.fn((token) => {
    if (!token || !token.startsWith('token:')) {
      throw new Error('invalid token');
    }
    const [, id, username] = token.split(':');
    return { id: Number(id), username };
  }),
}));

const { app, server } = require('./backend/server');

describe('fullstack integration (frontend contract to backend endpoints)', () => {
  afterAll((done) => {
    server.close(done);
  });

  beforeEach(() => {
    resetState();
    mockPoolQuery.mockClear();
  });

  it('covers auth lifecycle: register -> login -> me -> update profile -> username check -> logout', async () => {
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({ username: 'charlie', email: 'charlie@example.com', password: 'Password123!' });
    expect(registerRes.status).toBe(201);

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ username: 'charlie', password: 'Password123!' });
    expect(loginRes.status).toBe(200);
    const token = loginRes.body.token;

    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(meRes.status).toBe(200);
    expect(meRes.body.username).toBe('charlie');

    const updateRes = await request(app)
      .put('/api/users/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ bio: 'new bio', profile_pic_url: 'https://img.example/pic.png' });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.bio).toBe('new bio');

    const availableRes = await request(app).get('/api/users/check-username?username=charlie');
    expect(availableRes.status).toBe(200);
    expect(availableRes.body).toEqual({ available: false });

    const logoutRes = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${token}`);
    expect(logoutRes.status).toBe(200);
  });

  it('covers tweet flow: create -> like -> retweet -> feed -> delete', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ username: 'alice', password: 'Password123!' });
    const token = loginRes.body.token;

    const createRes = await request(app)
      .post('/api/tweets')
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'integration tweet' });
    expect(createRes.status).toBe(201);
    const tweetId = createRes.body.id;

    const likeRes = await request(app)
      .post(`/api/tweets/${tweetId}/like`)
      .set('Authorization', `Bearer ${token}`);
    expect(likeRes.status).toBe(200);
    expect(likeRes.body).toEqual({ liked: true });

    const retweetRes = await request(app)
      .post(`/api/tweets/${tweetId}/retweet`)
      .set('Authorization', `Bearer ${token}`);
    expect(retweetRes.status).toBe(200);
    expect(retweetRes.body).toEqual({ retweeted: true });

    const feedRes = await request(app)
      .get('/api/feed?limit=20&offset=0')
      .set('Authorization', `Bearer ${token}`);
    expect(feedRes.status).toBe(200);
    expect(Array.isArray(feedRes.body.tweets)).toBe(true);
    expect(feedRes.body.tweets.some((t) => t.id === tweetId)).toBe(true);

    const deleteRes = await request(app)
      .delete(`/api/tweets/${tweetId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(deleteRes.status).toBe(204);
  });

  it('covers social graph: follow/unfollow and block/unblock toggles', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ username: 'alice', password: 'Password123!' });
    const token = loginRes.body.token;

    const followRes = await request(app)
      .post('/api/users/2/follow')
      .set('Authorization', `Bearer ${token}`);
    expect(followRes.status).toBe(200);
    expect(followRes.body).toEqual({ following: true });

    const relationshipAfterFollowRes = await request(app)
      .get('/api/users/2/relationship')
      .set('Authorization', `Bearer ${token}`);
    expect(relationshipAfterFollowRes.status).toBe(200);
    expect(relationshipAfterFollowRes.body).toEqual({ following: true, blocked: false });

    const unfollowRes = await request(app)
      .post('/api/users/2/follow')
      .set('Authorization', `Bearer ${token}`);
    expect(unfollowRes.status).toBe(200);
    expect(unfollowRes.body).toEqual({ following: false });

    const blockRes = await request(app)
      .post('/api/users/2/block')
      .set('Authorization', `Bearer ${token}`);
    expect(blockRes.status).toBe(200);
    expect(blockRes.body).toEqual({ blocked: true });

    const relationshipAfterBlockRes = await request(app)
      .get('/api/users/2/relationship')
      .set('Authorization', `Bearer ${token}`);
    expect(relationshipAfterBlockRes.status).toBe(200);
    expect(relationshipAfterBlockRes.body).toEqual({ following: false, blocked: true });

    const unblockRes = await request(app)
      .post('/api/users/2/block')
      .set('Authorization', `Bearer ${token}`);
    expect(unblockRes.status).toBe(200);
    expect(unblockRes.body).toEqual({ blocked: false });

    const relationshipAfterUnblockRes = await request(app)
      .get('/api/users/2/relationship')
      .set('Authorization', `Bearer ${token}`);
    expect(relationshipAfterUnblockRes.status).toBe(200);
    expect(relationshipAfterUnblockRes.body).toEqual({ following: false, blocked: false });
  });

  it('covers profile tabs contract: tweets and likes', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ username: 'alice', password: 'Password123!' });
    const token = loginRes.body.token;

    const likeRes = await request(app)
      .post('/api/tweets/1/like')
      .set('Authorization', `Bearer ${token}`);
    expect(likeRes.status).toBe(200);

    const tweetsTabRes = await request(app)
      .get('/api/users/bob?tab=tweets')
      .set('Authorization', `Bearer ${token}`);
    expect(tweetsTabRes.status).toBe(200);
    expect(Array.isArray(tweetsTabRes.body.tweets)).toBe(true);

    const likesTabRes = await request(app)
      .get('/api/users/alice?tab=likes')
      .set('Authorization', `Bearer ${token}`);
    expect(likesTabRes.status).toBe(200);
    expect(Array.isArray(likesTabRes.body.likes)).toBe(true);
    expect(likesTabRes.body.likes.some((t) => t.id === 1)).toBe(true);
  });
});
