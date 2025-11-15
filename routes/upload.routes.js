// [File] routes/upload.routes.js

const express = require('express');
const router = express.Router();

// Lấy hàm middleware và controller
const { isAuth } = require('../middleware/auth'); 
const { singleAvatarUpload } = require('../middleware/upload'); 
const { uploadAvatar } = require('../controllers/upload.controller'); 

// POST /api/upload/avatar (Dòng 12)
router.post(
    '/avatar', 
    isAuth,               // Middleware 1
    singleAvatarUpload,   // Middleware 2 (Lỗi xảy ra nếu singleAvatarUpload là undefined)
    uploadAvatar          // Controller
);

module.exports = router;