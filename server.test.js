const request = require('supertest');
jest.mock('./backend/db', () => {
  const mockPoolQuery = jest.fn();
  return {
    pool: { query: mockPoolQuery },
    testConnection: jest.fn(),
  };
});
jest.mock('bcrypt', () => ({
  hash: jest.fn((password) => Promise.resolve('hashed_' + password)),
  compare: jest.fn(),
}));
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn((payload, secret) => 'mock-jwt-token'),
  verify: jest.fn(),
}));
const db = require('./backend/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { app, server } = require('./backend/server');

describe('server.js', () => {
  afterAll((done) => {
    server.close(done);
  });

  beforeEach(() => {
    db.pool.query.mockReset();
    bcrypt.hash.mockClear();
    bcrypt.compare.mockReset();
    jwt.verify.mockReset();
  });

  describe('GET /', () => {
    it('returns 200 with server status message', async () => {
      const response = await request(app).get('/');
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: 'Server is running' });
    });
  });

  describe('GET /api/health', () => {
    it('returns 200 when DB connection succeeds', async () => {
      db.testConnection.mockResolvedValue({ success: true, result: 2 });
      const response = await request(app).get('/api/health');
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ status: 'ok', database: 'connected' });
    });

    it('returns 500 when DB connection fails', async () => {
      db.testConnection.mockRejectedValue(new Error('Connection refused'));
      const response = await request(app).get('/api/health');
      expect(response.status).toBe(500);
      expect(response.body).toEqual({ status: 'error', database: 'disconnected' });
    });
  });

  describe('POST /api/auth/register', () => {
    it('returns 201 with user data on success', async () => {
      db.pool.query
        .mockResolvedValueOnce([[]])
        .mockResolvedValueOnce([{ insertId: 1 }]);

      const response = await request(app)
        .post('/api/auth/register')
        .send({ username: 'johndoe', email: 'john@example.com', password: 'password123' });

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        id: 1,
        username: 'johndoe',
        email: 'john@example.com',
      });
      expect(db.pool.query).toHaveBeenCalledWith(
        'SELECT id FROM users WHERE username = ?',
        ['johndoe']
      );
    });

    it('returns 400 when username is already taken', async () => {
      db.pool.query.mockResolvedValueOnce([[{ id: 1 }]]);

      const response = await request(app)
        .post('/api/auth/register')
        .send({ username: 'johndoe', email: 'john@example.com', password: 'password123' });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Username already taken' });
      expect(db.pool.query).toHaveBeenCalledTimes(1);
    });

    it('returns 400 when username is missing', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ email: 'john@example.com', password: 'password123' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Missing required fields');
      expect(response.body.details).toContain('username');
      expect(db.pool.query).not.toHaveBeenCalled();
    });

    it('returns 400 when email is missing', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ username: 'johndoe', password: 'password123' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Missing required fields');
      expect(response.body.details).toContain('email');
      expect(db.pool.query).not.toHaveBeenCalled();
    });

    it('returns 400 when password is missing', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ username: 'johndoe', email: 'john@example.com' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Missing required fields');
      expect(response.body.details).toContain('password');
      expect(db.pool.query).not.toHaveBeenCalled();
    });

    it('returns 400 when password is less than 8 characters', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ username: 'johndoe', email: 'john@example.com', password: 'short' });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'Password must be at least 8 characters',
      });
      expect(db.pool.query).not.toHaveBeenCalled();
    });

    it('returns 400 when INSERT fails with duplicate entry (e.g. email)', async () => {
      const dupError = new Error('Duplicate entry');
      dupError.code = 'ER_DUP_ENTRY';
      db.pool.query
        .mockResolvedValueOnce([[]])
        .mockRejectedValueOnce(dupError);

      const response = await request(app)
        .post('/api/auth/register')
        .send({ username: 'johndoe', email: 'taken@example.com', password: 'password123' });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Username or email already taken' });
    });
  });

  describe('POST /api/auth/login', () => {
    it('returns 200 with token and user on valid login', async () => {
      db.pool.query.mockResolvedValueOnce([
        [
          {
            id: 1,
            username: 'johndoe',
            email: 'john@example.com',
            password_hash: 'hashed_password123',
          },
        ],
      ]);
      bcrypt.compare.mockResolvedValue(true);

      const response = await request(app)
        .post('/api/auth/login')
        .send({ username: 'johndoe', password: 'password123' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toEqual({
        id: 1,
        username: 'johndoe',
        email: 'john@example.com',
      });
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashed_password123');
    });

    it('returns 401 when user does not exist', async () => {
      db.pool.query.mockResolvedValueOnce([[]]);

      const response = await request(app)
        .post('/api/auth/login')
        .send({ username: 'nobody', password: 'password123' });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({ error: 'Invalid username or password' });
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('returns 401 when password is wrong (bcrypt.compare failure branch)', async () => {
      db.pool.query.mockResolvedValueOnce([
        [
          {
            id: 1,
            username: 'johndoe',
            email: 'john@example.com',
            password_hash: 'hashed_password123',
          },
        ],
      ]);
      bcrypt.compare.mockResolvedValue(false);

      const response = await request(app)
        .post('/api/auth/login')
        .send({ username: 'johndoe', password: 'wrongpassword' });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({ error: 'Invalid username or password' });
      expect(bcrypt.compare).toHaveBeenCalledWith('wrongpassword', 'hashed_password123');
    });

    it('returns 400 when username is missing', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ password: 'password123' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Missing required fields');
      expect(response.body.details).toContain('username');
      expect(db.pool.query).not.toHaveBeenCalled();
    });

    it('returns 400 when password is missing', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ username: 'johndoe' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Missing required fields');
      expect(response.body.details).toContain('password');
      expect(db.pool.query).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/auth/me', () => {
    it('returns 200 with user when valid token provided', async () => {
      jwt.verify.mockReturnValue({ id: 1, username: 'johndoe' });
      db.pool.query.mockResolvedValueOnce([
        [
          {
            id: 1,
            username: 'johndoe',
            email: 'john@example.com',
            bio: null,
            profile_pic_url: null,
          },
        ],
      ]);

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        id: 1,
        username: 'johndoe',
        email: 'john@example.com',
        bio: null,
        profile_pic_url: null,
      });
      expect(jwt.verify).toHaveBeenCalledWith('valid-token', expect.any(String));
    });

    it('returns 401 when token is missing', async () => {
      const response = await request(app).get('/api/auth/me');

      expect(response.status).toBe(401);
      expect(response.body).toEqual({ error: 'Access token required' });
      expect(jwt.verify).not.toHaveBeenCalled();
    });

    it('returns 403 when token is invalid or expired (catch block)', async () => {
      jwt.verify.mockImplementation(() => {
        throw new Error('jwt expired');
      });

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(403);
      expect(response.body).toEqual({ error: 'Invalid or expired token' });
    });

    it('returns 404 when JWT is valid but user no longer exists', async () => {
      jwt.verify.mockReturnValue({ id: 99, username: 'ghost' });
      db.pool.query.mockResolvedValueOnce([[]]);

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'User not found' });
    });
  });

  describe('POST /api/auth/logout', () => {
    it('returns 200 when authenticated user logs out', async () => {
      jwt.verify.mockReturnValue({ id: 1, username: 'johndoe' });

      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: 'Logged out successfully' });
    });

    it('returns 401 when token is missing', async () => {
      const response = await request(app).post('/api/auth/logout');

      expect(response.status).toBe(401);
      expect(response.body).toEqual({ error: 'Access token required' });
    });
  });

  describe('POST /api/tweets', () => {
    const auth = () => jwt.verify.mockReturnValue({ id: 1, username: 'johndoe' });

    it('returns 201 with tweet on valid post', async () => {
      auth();
      db.pool.query.mockResolvedValueOnce([{ insertId: 1 }]);

      const response = await request(app)
        .post('/api/tweets')
        .set('Authorization', 'Bearer token')
        .send({ content: 'Hello world' });

      expect(response.status).toBe(201);
      expect(response.body.content).toBe('Hello world');
    });

    it('accepts exactly 280 characters', async () => {
      auth();
      db.pool.query.mockResolvedValueOnce([{ insertId: 1 }]);
      const content = 'a'.repeat(280);

      const response = await request(app)
        .post('/api/tweets')
        .set('Authorization', 'Bearer token')
        .send({ content });

      expect(response.status).toBe(201);
    });

    it('returns 400 when content exceeds 280 characters', async () => {
      auth();
      const response = await request(app)
        .post('/api/tweets')
        .set('Authorization', 'Bearer token')
        .send({ content: 'a'.repeat(281) });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('280');
    });

    it('accepts valid Quote Tweet with parent_tweet_id', async () => {
      auth();
      db.pool.query.mockResolvedValueOnce([{ insertId: 1 }]);

      const response = await request(app)
        .post('/api/tweets')
        .set('Authorization', 'Bearer token')
        .send({ content: 'Quote tweet', parent_tweet_id: 5 });

      expect(response.status).toBe(201);
      expect(response.body.parent_tweet_id).toBe(5);
    });
  });

  describe('DELETE /api/tweets/:id', () => {
    it('returns 204 when owner deletes', async () => {
      jwt.verify.mockReturnValue({ id: 1, username: 'johndoe' });
      db.pool.query
        .mockResolvedValueOnce([[{ id: 1, user_id: 1 }]])
        .mockResolvedValueOnce([{}]);

      const response = await request(app)
        .delete('/api/tweets/1')
        .set('Authorization', 'Bearer token');

      expect(response.status).toBe(204);
    });

    it('returns 403 when non-owner tries to delete', async () => {
      jwt.verify.mockReturnValue({ id: 2, username: 'other' });
      db.pool.query.mockResolvedValueOnce([[{ id: 1, user_id: 1 }]]);

      const response = await request(app)
        .delete('/api/tweets/1')
        .set('Authorization', 'Bearer token');

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('owner');
    });

    it('returns 404 when tweet not found', async () => {
      jwt.verify.mockReturnValue({ id: 1, username: 'johndoe' });
      db.pool.query.mockResolvedValueOnce([[]]);

      const response = await request(app)
        .delete('/api/tweets/999')
        .set('Authorization', 'Bearer token');

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/tweets/:id/like', () => {
    it('returns liked: true when liking (INSERT path)', async () => {
      jwt.verify.mockReturnValue({ id: 1, username: 'johndoe' });
      db.pool.query
        .mockResolvedValueOnce([[]])
        .mockResolvedValueOnce([{}]);

      const response = await request(app)
        .post('/api/tweets/1/like')
        .set('Authorization', 'Bearer token');

      expect(response.status).toBe(200);
      expect(response.body.liked).toBe(true);
    });

    it('returns liked: false when unliking (DELETE path)', async () => {
      jwt.verify.mockReturnValue({ id: 1, username: 'johndoe' });
      db.pool.query
        .mockResolvedValueOnce([[{ id: 1 }]])
        .mockResolvedValueOnce([{}]);

      const response = await request(app)
        .post('/api/tweets/1/like')
        .set('Authorization', 'Bearer token');

      expect(response.status).toBe(200);
      expect(response.body.liked).toBe(false);
    });
  });

  describe('POST /api/tweets/:id/retweet', () => {
    it('returns retweeted: true when retweeting (INSERT path)', async () => {
      jwt.verify.mockReturnValue({ id: 1, username: 'johndoe' });
      db.pool.query
        .mockResolvedValueOnce([[]])
        .mockResolvedValueOnce([{}]);

      const response = await request(app)
        .post('/api/tweets/1/retweet')
        .set('Authorization', 'Bearer token');

      expect(response.status).toBe(200);
      expect(response.body.retweeted).toBe(true);
    });

    it('returns retweeted: false when un-retweeting (DELETE path)', async () => {
      jwt.verify.mockReturnValue({ id: 1, username: 'johndoe' });
      db.pool.query
        .mockResolvedValueOnce([[{ id: 1 }]])
        .mockResolvedValueOnce([{}]);

      const response = await request(app)
        .post('/api/tweets/1/retweet')
        .set('Authorization', 'Bearer token');

      expect(response.status).toBe(200);
      expect(response.body.retweeted).toBe(false);
    });
  });

  describe('POST /api/users/:id/follow', () => {
    it('returns following: true when following', async () => {
      jwt.verify.mockReturnValue({ id: 1, username: 'johndoe' });
      db.pool.query
        .mockResolvedValueOnce([[]])
        .mockResolvedValueOnce([{}]);

      const response = await request(app)
        .post('/api/users/2/follow')
        .set('Authorization', 'Bearer token');

      expect(response.status).toBe(200);
      expect(response.body.following).toBe(true);
    });

    it('returns following: false when unfollowing', async () => {
      jwt.verify.mockReturnValue({ id: 1, username: 'johndoe' });
      db.pool.query
        .mockResolvedValueOnce([[{ id: 1 }]])
        .mockResolvedValueOnce([{}]);

      const response = await request(app)
        .post('/api/users/2/follow')
        .set('Authorization', 'Bearer token');

      expect(response.status).toBe(200);
      expect(response.body.following).toBe(false);
    });

    it('returns 400 when trying to follow self', async () => {
      jwt.verify.mockReturnValue({ id: 1, username: 'johndoe' });

      const response = await request(app)
        .post('/api/users/1/follow')
        .set('Authorization', 'Bearer token');

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('yourself');
    });
  });

  describe('POST /api/users/:id/block', () => {
    it('returns blocked: true and deletes follows', async () => {
      jwt.verify.mockReturnValue({ id: 1, username: 'johndoe' });
      db.pool.query
        .mockResolvedValueOnce([{}])
        .mockResolvedValueOnce([[]])
        .mockResolvedValueOnce([{}]);

      const response = await request(app)
        .post('/api/users/2/block')
        .set('Authorization', 'Bearer token');

      expect(response.status).toBe(200);
      expect(response.body.blocked).toBe(true);
      expect(db.pool.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM follows'),
        expect.any(Array)
      );
    });

    it('returns blocked: false when unblocking an already blocked user', async () => {
      jwt.verify.mockReturnValue({ id: 1, username: 'johndoe' });
      db.pool.query
        .mockResolvedValueOnce([[{ id: 10 }]])
        .mockResolvedValueOnce([{}]);

      const response = await request(app)
        .post('/api/users/2/block')
        .set('Authorization', 'Bearer token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ blocked: false });
      expect(db.pool.query).toHaveBeenCalledWith(
        'DELETE FROM blocks WHERE blocker_id = ? AND blocked_id = ?',
        [1, 2]
      );
    });

    it('returns 400 when trying to block yourself', async () => {
      jwt.verify.mockReturnValue({ id: 1, username: 'johndoe' });

      const response = await request(app)
        .post('/api/users/1/block')
        .set('Authorization', 'Bearer token');

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('yourself');
    });
  });

  describe('PUT /api/users/me', () => {
    it('updates username, bio, profile pic, and password', async () => {
      jwt.verify.mockReturnValue({ id: 1, username: 'johndoe' });
      db.pool.query
        .mockResolvedValueOnce([{}])
        .mockResolvedValueOnce([[
          {
            id: 1,
            username: 'newname',
            email: 'john@example.com',
            bio: 'new bio',
            profile_pic_url: 'https://img.example/pic.png',
          },
        ]]);

      const response = await request(app)
        .put('/api/users/me')
        .set('Authorization', 'Bearer token')
        .send({
          username: 'newname',
          bio: 'new bio',
          profile_pic_url: 'https://img.example/pic.png',
          password: 'Password123!',
        });

      expect(response.status).toBe(200);
      expect(response.body.username).toBe('newname');
      expect(bcrypt.hash).toHaveBeenCalledWith('Password123!', 10);
    });

    it('returns 400 when no fields are provided', async () => {
      jwt.verify.mockReturnValue({ id: 1, username: 'johndoe' });

      const response = await request(app)
        .put('/api/users/me')
        .set('Authorization', 'Bearer token')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'No fields to update' });
    });

    it('returns 400 when username is empty', async () => {
      jwt.verify.mockReturnValue({ id: 1, username: 'johndoe' });

      const response = await request(app)
        .put('/api/users/me')
        .set('Authorization', 'Bearer token')
        .send({ username: '   ' });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Username cannot be empty' });
    });

    it('returns 400 when password is shorter than 8 chars', async () => {
      jwt.verify.mockReturnValue({ id: 1, username: 'johndoe' });

      const response = await request(app)
        .put('/api/users/me')
        .set('Authorization', 'Bearer token')
        .send({ password: 'short' });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Password must be at least 8 characters' });
    });

    it('returns 400 when username update violates unique constraint', async () => {
      jwt.verify.mockReturnValue({ id: 1, username: 'johndoe' });
      const dupError = new Error('Duplicate entry');
      dupError.code = 'ER_DUP_ENTRY';
      db.pool.query.mockRejectedValueOnce(dupError);

      const response = await request(app)
        .put('/api/users/me')
        .set('Authorization', 'Bearer token')
        .send({ username: 'takenname' });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Username already taken' });
    });
  });

  describe('GET /api/users/:username', () => {
    it('returns user with tweets when found', async () => {
      db.pool.query
        .mockResolvedValueOnce([[{ id: 1, username: 'johndoe', email: 'j@x.com', bio: null, profile_pic_url: null }]])
        .mockResolvedValueOnce([[{ id: 1, content: 'test', user_id: 1 }]]);

      const response = await request(app).get('/api/users/johndoe?tab=tweets');

      expect(response.status).toBe(200);
      expect(response.body.username).toBe('johndoe');
      expect(response.body.tweets).toHaveLength(1);
    });

    it('returns 404 when user not found', async () => {
      db.pool.query.mockResolvedValueOnce([[]]);

      const response = await request(app).get('/api/users/nobody');

      expect(response.status).toBe(404);
    });

    it('returns user with empty likes when tab=likes and no likes', async () => {
      db.pool.query
        .mockResolvedValueOnce([[{ id: 1, username: 'johndoe', email: 'j@x.com', bio: null, profile_pic_url: null }]])
        .mockResolvedValueOnce([[]]);

      const response = await request(app).get('/api/users/johndoe?tab=likes');

      expect(response.status).toBe(200);
      expect(response.body.likes).toEqual([]);
    });

    it('returns base profile when tab is not tweets or likes', async () => {
      db.pool.query.mockResolvedValueOnce([[
        { id: 1, username: 'johndoe', email: 'j@x.com', bio: 'hi', profile_pic_url: null },
      ]]);

      const response = await request(app).get('/api/users/johndoe?tab=about');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        id: 1,
        username: 'johndoe',
        email: 'j@x.com',
        bio: 'hi',
        profile_pic_url: null,
      });
    });
  });

  describe('GET /api/feed', () => {
    it('returns tweets for authenticated user', async () => {
      jwt.verify.mockReturnValue({ id: 1, username: 'johndoe' });
      db.pool.query
        .mockResolvedValueOnce([[]])
        .mockResolvedValueOnce([[{ id: 1, content: 'global', user_id: 2 }]]);

      const response = await request(app)
        .get('/api/feed')
        .set('Authorization', 'Bearer token');

      expect(response.status).toBe(200);
      expect(response.body.tweets).toBeDefined();
    });

    it('returns global tweets when user has no follows', async () => {
      jwt.verify.mockReturnValue({ id: 1, username: 'johndoe' });
      db.pool.query
        .mockResolvedValueOnce([[]])
        .mockResolvedValueOnce([[{ id: 1, content: 'tweet', user_id: 2 }]]);

      const response = await request(app)
        .get('/api/feed')
        .set('Authorization', 'Bearer token');

      expect(response.status).toBe(200);
      expect(response.body.tweets.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('GET /api/users/search/query', () => {
    it('returns users matching query', async () => {
      db.pool.query.mockResolvedValueOnce([[{ id: 1, username: 'johndoe' }]]);

      const response = await request(app).get('/api/users/search/query?q=john');

      expect(response.status).toBe(200);
      expect(response.body.users).toHaveLength(1);
    });

    it('returns empty array when q is empty', async () => {
      const response = await request(app).get('/api/users/search/query?q=');

      expect(response.status).toBe(200);
      expect(response.body.users).toEqual([]);
    });
  });

  describe('GET /api/users/:id/relationship', () => {
    it('returns relationship booleans for authenticated user', async () => {
      jwt.verify.mockReturnValue({ id: 1, username: 'johndoe' });
      db.pool.query
        .mockResolvedValueOnce([[{ id: 1 }]])
        .mockResolvedValueOnce([[]]);

      const response = await request(app)
        .get('/api/users/2/relationship')
        .set('Authorization', 'Bearer token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ following: true, blocked: false });
    });

    it('returns false/false for self relationship', async () => {
      jwt.verify.mockReturnValue({ id: 1, username: 'johndoe' });

      const response = await request(app)
        .get('/api/users/1/relationship')
        .set('Authorization', 'Bearer token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ following: false, blocked: false });
      expect(db.pool.query).not.toHaveBeenCalled();
    });
  });

  describe('POST /api/users/me/profile-picture', () => {
    it('returns 401 when token is missing', async () => {
      const response = await request(app).post('/api/users/me/profile-picture');

      expect(response.status).toBe(401);
      expect(response.body).toEqual({ error: 'Access token required' });
    });

    it('returns 400 when no file is uploaded', async () => {
      jwt.verify.mockReturnValue({ id: 1, username: 'johndoe' });

      const response = await request(app)
        .post('/api/users/me/profile-picture')
        .set('Authorization', 'Bearer token');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('No file uploaded');
    });

    it('uploads file and returns updated user', async () => {
      jwt.verify.mockReturnValue({ id: 1, username: 'johndoe' });
      db.pool.query
        .mockResolvedValueOnce([{}])
        .mockResolvedValueOnce([[{
          id: 1,
          username: 'johndoe',
          email: 'john@example.com',
          bio: null,
          profile_pic_url: '/api/uploads/user-1-123.png',
        }]]);

      const response = await request(app)
        .post('/api/users/me/profile-picture')
        .set('Authorization', 'Bearer token')
        .attach('profile_picture', Buffer.from('fake-image-data'), 'avatar.png');

      expect(response.status).toBe(200);
      expect(response.body.username).toBe('johndoe');
      expect(response.body.profile_pic_url).toContain('/api/uploads/');
    });
  });
});
