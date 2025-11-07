// [File] routes/upload.routes.js

const express = require('express');
const router = express.Router();

// ⭐️ IMPORT BẮT BUỘC:
const { authMiddleware } = require('../middleware/auth'); 
const uploadMiddleware = require('../middleware/upload');

// ⭐️ SỬA: Dùng destructuring để import hàm từ controller
const { uploadAvatar } = require('../controllers/upload.controller');


// POST /api/upload/avatar: Chọn/upload ảnh Avatar
router.post(
    '/avatar', 
    authMiddleware,       // 1. Xác thực (req.user)
    uploadMiddleware,     // 2. Xử lý file (req.file)
    uploadAvatar          // ⭐️ Hàm xử lý (callback function)
);

module.exports = router;