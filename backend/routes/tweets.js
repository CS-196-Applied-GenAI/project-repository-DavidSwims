const express = require('express');
const { pool } = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const MAX_CONTENT_LENGTH = 280;

/**
 * POST /api/tweets (protected)
 * Body: { content, parent_tweet_id? }
 * - content: required, max 280 chars
 * - parent_tweet_id: optional, for Quote Tweets/Replies
 */
router.post('/', authenticateToken, async (req, res) => {
  const { content, parent_tweet_id } = req.body;
  const userId = req.user.id;

  if (!content || typeof content !== 'string') {
    return res.status(400).json({ error: 'Content is required' });
  }

  if (content.length > MAX_CONTENT_LENGTH) {
    return res.status(400).json({
      error: `Content must be at most ${MAX_CONTENT_LENGTH} characters`,
    });
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO tweets (user_id, content, parent_tweet_id) VALUES (?, ?, ?)',
      [userId, content, parent_tweet_id || null]
    );

    res.status(201).json({
      id: result.insertId,
      user_id: userId,
      content,
      parent_tweet_id: parent_tweet_id || null,
    });
  } catch (err) {
    throw err;
  }
});

/**
 * DELETE /api/tweets/:id (protected)
 * Only the owner can delete.
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  const tweetId = req.params.id;
  const userId = req.user.id;

  try {
    const [rows] = await pool.query(
      'SELECT id, user_id FROM tweets WHERE id = ?',
      [tweetId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Tweet not found' });
    }

    if (rows[0].user_id !== userId) {
      return res.status(403).json({ error: 'Forbidden: not the tweet owner' });
    }

    await pool.query('DELETE FROM tweets WHERE id = ?', [tweetId]);
    res.status(204).send();
  } catch (err) {
    throw err;
  }
});

/**
 * POST /api/tweets/:id/like (protected)
 * Toggle: like if not liked, unlike if already liked.
 */
router.post('/:id/like', authenticateToken, async (req, res) => {
  const tweetId = req.params.id;
  const userId = req.user.id;

  try {
    const [existing] = await pool.query(
      'SELECT id FROM likes WHERE user_id = ? AND tweet_id = ?',
      [userId, tweetId]
    );

    if (existing.length > 0) {
      await pool.query(
        'DELETE FROM likes WHERE user_id = ? AND tweet_id = ?',
        [userId, tweetId]
      );
      return res.json({ liked: false });
    }

    await pool.query(
      'INSERT INTO likes (user_id, tweet_id) VALUES (?, ?)',
      [userId, tweetId]
    );
    res.json({ liked: true });
  } catch (err) {
    throw err;
  }
});

/**
 * POST /api/tweets/:id/retweet (protected)
 * Toggle: retweet if not retweeted, un-retweet if already retweeted.
 */
router.post('/:id/retweet', authenticateToken, async (req, res) => {
  const tweetId = req.params.id;
  const userId = req.user.id;

  try {
    const [existing] = await pool.query(
      'SELECT id FROM retweets WHERE user_id = ? AND tweet_id = ?',
      [userId, tweetId]
    );

    if (existing.length > 0) {
      await pool.query(
        'DELETE FROM retweets WHERE user_id = ? AND tweet_id = ?',
        [userId, tweetId]
      );
      return res.json({ retweeted: false });
    }

    await pool.query(
      'INSERT INTO retweets (user_id, tweet_id) VALUES (?, ?)',
      [userId, tweetId]
    );
    res.json({ retweeted: true });
  } catch (err) {
    throw err;
  }
});

module.exports = router;
