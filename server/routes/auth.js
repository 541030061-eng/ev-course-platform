const express = require('express');
const bcrypt = require('bcryptjs');
const { query, run } = require('../db');
const { generateToken, authMiddleware } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { username, password, role } = req.body;
    if (!username || !password || !role) {
      return res.json({ code: 400, msg: '用户名、密码和角色不能为空' });
    }
    if (!['teacher', 'student'].includes(role)) {
      return res.json({ code: 400, msg: '角色只能是 teacher 或 student' });
    }
    // 检查是否已存在
    const exist = query('SELECT id FROM users WHERE username = ?', [username]);
    if (exist.length > 0) {
      return res.json({ code: 400, msg: '用户名已被注册' });
    }
    const hashedPwd = bcrypt.hashSync(password, 10);
    const result = run(
      'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
      [username, hashedPwd, role]
    );
    const user = { id: result.lastID, username, role };
    const token = generateToken(user);
    res.json({ code: 0, msg: '注册成功', data: { token, user } });
  } catch (err) {
    res.json({ code: 500, msg: '服务器错误: ' + err.message });
  }
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.json({ code: 400, msg: '用户名和密码不能为空' });
    }
    const users = query('SELECT * FROM users WHERE username = ?', [username]);
    if (users.length === 0) {
      return res.json({ code: 400, msg: '用户不存在' });
    }
    const user = users[0];
    if (!bcrypt.compareSync(password, user.password)) {
      return res.json({ code: 400, msg: '密码错误' });
    }
    const token = generateToken(user);
    res.json({
      code: 0,
      msg: '登录成功',
      data: {
        token,
        user: { id: user.id, username: user.username, role: user.role, avatar: user.avatar }
      }
    });
  } catch (err) {
    res.json({ code: 500, msg: '服务器错误: ' + err.message });
  }
});

// GET /api/auth/me - 获取当前用户信息
router.get('/me', authMiddleware, (req, res) => {
  const users = query('SELECT id, username, role, avatar FROM users WHERE id = ?', [req.user.id]);
  if (users.length === 0) {
    return res.json({ code: 404, msg: '用户不存在' });
  }
  res.json({ code: 0, data: users[0] });
});

// GET /api/auth/users - 获取用户列表（用于指定可见人选）
router.get('/users', authMiddleware, (req, res) => {
  const users = query('SELECT id, username, role, avatar FROM users');
  res.json({ code: 0, data: users });
});

module.exports = router;
