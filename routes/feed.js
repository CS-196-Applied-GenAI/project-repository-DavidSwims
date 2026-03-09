const express = require('express');
const { pool } = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/feed (protected)
 * Hybrid: followed tweets first, then global. Excludes blocked users.
 * Supports limit and offset.
 */
router.get('/', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
  const offset = parseInt(req.query.offset, 10) || 0;

  try {
    const [followed] = await pool.query(
      `SELECT t.id, t.user_id, t.content, t.parent_tweet_id, t.created_at, u.username
       FROM tweets t
       INNER JOIN users u ON t.user_id = u.id
       INNER JOIN follows f ON t.user_id = f.following_id AND f.follower_id = ?
       WHERE NOT EXISTS (
         SELECT 1 FROM blocks b 
         WHERE (b.blocker_id = ? AND b.blocked_id = t.user_id) 
            OR (b.blocker_id = t.user_id AND b.blocked_id = ?)
       )
       ORDER BY t.created_at DESC
       LIMIT ? OFFSET ?`,
      [userId, userId, userId, limit, offset]
    );

    const [global] = await pool.query(
      `SELECT t.id, t.user_id, t.content, t.parent_tweet_id, t.created_at, u.username
       FROM tweets t
       INNER JOIN users u ON t.user_id = u.id
       WHERE t.user_id NOT IN (SELECT following_id FROM follows WHERE follower_id = ?)
         AND NOT EXISTS (
           SELECT 1 FROM blocks b 
           WHERE (b.blocker_id = ? AND b.blocked_id = t.user_id) 
              OR (b.blocker_id = t.user_id AND b.blocked_id = ?)
         )
       ORDER BY t.created_at DESC
       LIMIT ? OFFSET ?`,
      [userId, userId, userId, limit, offset]
    );

    const tweets = [...followed, ...global].sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );

    res.json({ tweets });
  } catch (err) {
    throw err;
  }
});

module.exports = router;
