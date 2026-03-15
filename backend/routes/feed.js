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
      `SELECT t.id, t.user_id, t.content, t.parent_tweet_id, t.created_at, u.username, u.profile_pic_url,
              (SELECT COUNT(*) FROM likes l WHERE l.tweet_id = t.id) AS like_count,
              (SELECT COUNT(*) FROM retweets r WHERE r.tweet_id = t.id) AS retweet_count,
              EXISTS(SELECT 1 FROM likes l2 WHERE l2.tweet_id = t.id AND l2.user_id = ?) AS liked_by_me,
              EXISTS(SELECT 1 FROM retweets r2 WHERE r2.tweet_id = t.id AND r2.user_id = ?) AS retweeted_by_me
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
      [userId, userId, userId, userId, userId, limit, offset]
    );

    const [global] = await pool.query(
      `SELECT t.id, t.user_id, t.content, t.parent_tweet_id, t.created_at, u.username, u.profile_pic_url,
              (SELECT COUNT(*) FROM likes l WHERE l.tweet_id = t.id) AS like_count,
              (SELECT COUNT(*) FROM retweets r WHERE r.tweet_id = t.id) AS retweet_count,
              EXISTS(SELECT 1 FROM likes l2 WHERE l2.tweet_id = t.id AND l2.user_id = ?) AS liked_by_me,
              EXISTS(SELECT 1 FROM retweets r2 WHERE r2.tweet_id = t.id AND r2.user_id = ?) AS retweeted_by_me
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
      [userId, userId, userId, userId, userId, limit, offset]
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
