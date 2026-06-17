const express = require('express');
const multer = require('multer');
const path = require('path');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

const storage = multer.diskStorage({
  destination: path.join(__dirname, '../../uploads'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = Date.now() + '-' + Math.round(Math.random() * 1e9) + ext;
    cb(null, name);
  }
});
const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } });

// POST /api/upload — 上传文件
router.post('/', authMiddleware, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.json({ code: 400, msg: '请选择文件' });
  }
  res.json({
    code: 0,
    data: {
      url: '/uploads/' + req.file.filename,
      name: req.file.originalname
    }
  });
});

module.exports = router;
