// [File] routes/upload.routes.js - ĐÃ SỬA LỖI IMPORT

const express = require('express');
const router = express.Router();

// ⭐️ ĐÃ SỬA: Import Destructuring cho singleAvatarUpload
// Lấy hàm middleware và controller
const { isAuth } = require('../middleware/auth'); 
const { singleAvatarUpload } = require('../middleware/upload'); 

// ⭐️ ĐÃ SỬA: uploadAvatar nằm trong user.controller.js (Giả định)
const { uploadAvatar } = require('../controllers/user.controller'); 


// POST /api/upload/avatar
router.post(
    '/avatar', 
    isAuth,               
    singleAvatarUpload,   // Sau khi sửa import, hàm này sẽ hoạt động
    uploadAvatar          
);

module.exports = router;