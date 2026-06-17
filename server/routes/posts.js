const express = require('express');
const { query, run } = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// GET /api/posts — 获取帖子列表（根据权限过滤）
router.get('/', authMiddleware, (req, res) => {
  try {
    const { type, page = 1, pageSize = 20 } = req.query;
    const userId = req.user.id;
    const userRole = req.user.role;
    const offset = (parseInt(page) - 1) * parseInt(pageSize);

    let typeFilter = '';
    const params = [];
    if (type && ['knowledge', 'homework', 'discussion'].includes(type)) {
      typeFilter = ' AND p.type = ?';
      params.push(type);
    }

    // 权限过滤逻辑：
    // 1. visibility='public' 所有人可见
    // 2. visibility='teachers_only' 仅老师可见
    // 3. visibility='students_only' 仅学生可见
    // 4. visibility='specific' 白名单用户可见（含作者本人）
    const sql = `
      SELECT DISTINCT p.*, u.username, u.role, u.avatar
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE (
        p.visibility = 'public'
        OR (p.visibility = 'teachers_only' AND ? = 'teacher')
        OR (p.visibility = 'students_only' AND ? = 'student')
        OR (p.visibility = 'specific' AND (
          p.user_id = ?
          OR EXISTS (SELECT 1 FROM post_visibility pv WHERE pv.post_id = p.id AND pv.user_id = ?)
        ))
      )${typeFilter}
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `;
    params.unshift(userId);  // 第4个? — specific 白名单 + 作者本人
    params.unshift(userId);  // 第3个? — specific 作者本人
    params.unshift(userRole); // 第2个? — students_only
    params.unshift(userRole); // 第1个? — teachers_only
    params.push(parseInt(pageSize), offset);

    const posts = query(sql, params);

    // 获取总数（简化版）
    let countSql = `
      SELECT COUNT(DISTINCT p.id) as total FROM posts p
      WHERE (
        p.visibility = 'public'
        OR (p.visibility = 'teachers_only' AND ? = 'teacher')
        OR (p.visibility = 'students_only' AND ? = 'student')
        OR (p.visibility = 'specific' AND (
          p.user_id = ?
          OR EXISTS (SELECT 1 FROM post_visibility pv WHERE pv.post_id = p.id AND pv.user_id = ?)
        ))
      )${typeFilter}
    `;
    const countParams = [userRole, userRole, userId, userId, ...params.slice(4, -2)];
    const countResult = query(countSql, countParams);
    const total = countResult[0] ? countResult[0].total : 0;

    res.json({
      code: 0,
      data: {
        list: posts,
        total,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    });
  } catch (err) {
    res.json({ code: 500, msg: '服务器错误: ' + err.message });
  }
});

// GET /api/posts/:id — 获取帖子详情
router.get('/:id', authMiddleware, (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user.id;
    const userRole = req.user.role;

    const posts = query(`
      SELECT p.*, u.username, u.role, u.avatar
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.id = ?
    `, [postId]);

    if (posts.length === 0) {
      return res.json({ code: 404, msg: '帖子不存在' });
    }

    const post = posts[0];

    // 权限检查
    let canView = false;
    if (post.visibility === 'public') {
      canView = true;
    } else if (post.visibility === 'teachers_only' && userRole === 'teacher') {
      canView = true;
    } else if (post.visibility === 'students_only' && userRole === 'student') {
      canView = true;
    } else if (post.visibility === 'specific') {
      if (post.user_id === userId) {
        canView = true;
      } else {
        const pv = query(
          'SELECT 1 FROM post_visibility WHERE post_id = ? AND user_id = ?',
          [postId, userId]
        );
        canView = pv.length > 0;
      }
    }

    if (!canView) {
      return res.json({ code: 403, msg: '你没有权限查看此内容' });
    }

    res.json({ code: 0, data: post });
  } catch (err) {
    res.json({ code: 500, msg: '服务器错误: ' + err.message });
  }
});

// POST /api/posts — 创建帖子
router.post('/', authMiddleware, (req, res) => {
  try {
    const { title, content, type, visibility, file_url, file_name, visibleUsers } = req.body;
    if (!title) {
      return res.json({ code: 400, msg: '标题不能为空' });
    }
    if (!['knowledge', 'homework', 'discussion'].includes(type)) {
      return res.json({ code: 400, msg: '类型不合法' });
    }
    if (!['public', 'teachers_only', 'students_only', 'specific'].includes(visibility)) {
      return res.json({ code: 400, msg: '可见性设置不合法' });
    }

    const result = run(
      `INSERT INTO posts (user_id, title, content, type, visibility, file_url, file_name)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, title, content || '', type, visibility, file_url || '', file_name || '']
    );

    const postId = result.lastID;

    // 如果是指定用户可见，保存白名单
    if (visibility === 'specific' && visibleUsers && Array.isArray(visibleUsers)) {
      for (const uid of visibleUsers) {
        run('INSERT INTO post_visibility (post_id, user_id) VALUES (?, ?)', [postId, uid]);
      }
    }

    res.json({ code: 0, msg: '发布成功', data: { id: postId } });
  } catch (err) {
    res.json({ code: 500, msg: '服务器错误: ' + err.message });
  }
});

// DELETE /api/posts/:id — 删除帖子
router.delete('/:id', authMiddleware, (req, res) => {
  try {
    const postId = req.params.id;
    const posts = query('SELECT * FROM posts WHERE id = ?', [postId]);
    if (posts.length === 0) {
      return res.json({ code: 404, msg: '帖子不存在' });
    }
    if (posts[0].user_id !== req.user.id) {
      return res.json({ code: 403, msg: '只能删除自己的帖子' });
    }
    run('DELETE FROM post_visibility WHERE post_id = ?', [postId]);
    run('DELETE FROM comments WHERE post_id = ?', [postId]);
    run('DELETE FROM posts WHERE id = ?', [postId]);
    res.json({ code: 0, msg: '删除成功' });
  } catch (err) {
    res.json({ code: 500, msg: '服务器错误: ' + err.message });
  }
});

module.exports = router;
