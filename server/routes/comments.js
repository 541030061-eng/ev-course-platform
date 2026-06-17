const express = require('express');
const { query, run } = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// GET /api/comments/:postId
router.get('/:postId', authMiddleware, (req, res) => {
  try {
    const { postId } = req.params;
    const comments = query(`
      SELECT c.*, u.username, u.role, u.avatar
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.post_id = ?
      ORDER BY c.created_at ASC
    `, [postId]);
    res.json({ code: 0, data: comments });
  } catch (err) {
    res.json({ code: 500, msg: '服务器错误: ' + err.message });
  }
});

// POST /api/comments
router.post('/', authMiddleware, (req, res) => {
  try {
    const { post_id, content } = req.body;
    if (!post_id || !content) {
      return res.json({ code: 400, msg: '帖子ID和评论内容不能为空' });
    }
    const result = run(
      'INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)',
      [post_id, req.user.id, content]
    );
    res.json({ code: 0, msg: '评论成功', data: { id: result.lastID } });
  } catch (err) {
    res.json({ code: 500, msg: '服务器错误: ' + err.message });
  }
});

module.exports = router;
