const express = require('express');
const bcrypt = require('bcrypt');
const { pool } = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

/**
 * PUT /api/users/me (protected)
 * Update the authenticated user's profile: bio, username, profile_pic_url, password.
 */
router.put('/me', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { bio, username, profile_pic_url, password } = req.body;

  const fields = [];
  const values = [];

  if (username !== undefined) {
    if (!username || username.trim() === '') {
      return res.status(400).json({ error: 'Username cannot be empty' });
    }
    fields.push('username = ?');
    values.push(username.trim());
  }

  if (bio !== undefined) {
    fields.push('bio = ?');
    values.push(bio);
  }

  if (profile_pic_url !== undefined) {
    fields.push('profile_pic_url = ?');
    values.push(profile_pic_url);
  }

  if (password !== undefined) {
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }
    const password_hash = await bcrypt.hash(password, 10);
    fields.push('password_hash = ?');
    values.push(password_hash);
  }

  if (fields.length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  values.push(userId);

  try {
    await pool.query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    const [rows] = await pool.query(
      'SELECT id, username, email, bio, profile_pic_url FROM users WHERE id = ?',
      [userId]
    );
    res.json(rows[0]);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Username already taken' });
    }
    throw err;
  }
});

/**
 * GET /api/users/search?q=username
 * Search users by username. Supports limit and offset.
 */
router.get('/search/query', async (req, res) => {
  const q = (req.query.q || '').trim();
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
  const offset = parseInt(req.query.offset, 10) || 0;

  if (!q) {
    return res.json({ users: [] });
  }

  try {
    const [users] = await pool.query(
      'SELECT id, username, email, bio, profile_pic_url FROM users WHERE username LIKE ? LIMIT ? OFFSET ?',
      [`%${q}%`, limit, offset]
    );
    res.json({ users });
  } catch (err) {
    throw err;
  }
});

/**
 * POST /api/users/:id/follow (protected)
 * Toggle: follow if not following, unfollow if already following.
 * Prevents self-follow (400).
 */
router.post('/:id/follow', authenticateToken, async (req, res) => {
  const targetId = parseInt(req.params.id, 10);
  const followerId = req.user.id;

  if (followerId === targetId) {
    return res.status(400).json({ error: 'Cannot follow yourself' });
  }

  try {
    const [existing] = await pool.query(
      'SELECT id FROM follows WHERE follower_id = ? AND following_id = ?',
      [followerId, targetId]
    );

    if (existing.length > 0) {
      await pool.query(
        'DELETE FROM follows WHERE follower_id = ? AND following_id = ?',
        [followerId, targetId]
      );
      return res.json({ following: false });
    }

    await pool.query(
      'INSERT INTO follows (follower_id, following_id) VALUES (?, ?)',
      [followerId, targetId]
    );
    res.json({ following: true });
  } catch (err) {
    throw err;
  }
});

/**
 * POST /api/users/:id/block (protected)
 * Toggle: block if not blocked, unblock if already blocked.
 * On block, also removes any follows between the two users.
 */
router.post('/:id/block', authenticateToken, async (req, res) => {
  const blockedId = parseInt(req.params.id, 10);
  const blockerId = req.user.id;

  if (blockerId === blockedId) {
    return res.status(400).json({ error: 'Cannot block yourself' });
  }

  try {
    const [existing] = await pool.query(
      'SELECT id FROM blocks WHERE blocker_id = ? AND blocked_id = ?',
      [blockerId, blockedId]
    );

    if (existing.length > 0) {
      await pool.query(
        'DELETE FROM blocks WHERE blocker_id = ? AND blocked_id = ?',
        [blockerId, blockedId]
      );
      return res.json({ blocked: false });
    }

    // Remove any follows between the two users before blocking
    await pool.query(
      'DELETE FROM follows WHERE (follower_id = ? AND following_id = ?) OR (follower_id = ? AND following_id = ?)',
      [blockerId, blockedId, blockedId, blockerId]
    );

    await pool.query(
      'INSERT INTO blocks (blocker_id, blocked_id) VALUES (?, ?)',
      [blockerId, blockedId]
    );
    res.json({ blocked: true });
  } catch (err) {
    throw err;
  }
});

/**
 * GET /api/users/:username
 * Returns user profile with optional ?tab=tweets|likes
 */
router.get('/:username', async (req, res) => {
  const { username } = req.params;
  const tab = req.query.tab || 'tweets';

  try {
    const [users] = await pool.query(
      'SELECT id, username, email, bio, profile_pic_url FROM users WHERE username = ?',
      [username]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = users[0];

    if (tab === 'tweets') {
      const [tweets] = await pool.query(
        'SELECT id, user_id, content, parent_tweet_id, created_at FROM tweets WHERE user_id = ? ORDER BY created_at DESC',
        [user.id]
      );
      return res.json({ ...user, tweets });
    }

    if (tab === 'likes') {
      const [likes] = await pool.query(
        `SELECT t.id, t.user_id, t.content, t.parent_tweet_id, t.created_at 
         FROM tweets t 
         INNER JOIN likes l ON t.id = l.tweet_id 
         WHERE l.user_id = ? 
         ORDER BY l.created_at DESC`,
        [user.id]
      );
      return res.json({ ...user, likes });
    }

    res.json(user);
  } catch (err) {
    throw err;
  }
});

module.exports = router;
