const express = require('express');
const cors = require('cors');
const path = require('path');
const { getDb } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件（Web前端 + 上传的文件）
app.use(express.static(path.join(__dirname, '../web')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// 路由
app.use('/api/auth', require('./routes/auth'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/comments', require('./routes/comments'));
app.use('/api/upload', require('./routes/upload'));

// 健康检查（供外部监控服务保持唤醒）
app.get('/ping', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// 启动
const KEEP_ALIVE_URL = process.env.KEEP_ALIVE_URL || '';

async function start() {
  await getDb();
  console.log('数据库初始化完成');
  app.listen(PORT, () => {
    console.log(`服务器已启动: http://localhost:${PORT}`);
    console.log('电动汽车技术课程平台 API 已就绪');
    // 自唤醒：每5分钟ping自己，保持Render不休眠
    if (KEEP_ALIVE_URL) {
      setInterval(() => {
        const http = require(KEEP_ALIVE_URL.startsWith('https') ? 'https' : 'http');
        http.get(KEEP_ALIVE_URL + '/ping', () => {});
      }, 5 * 60 * 1000);
      console.log('自唤醒已启用');
    }
  });
}

start().catch(err => {
  console.error('启动失败:', err);
  process.exit(1);
});
