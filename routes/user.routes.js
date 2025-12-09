// [File] user.routes.js (ĐÃ SỬA LỖI XUNG ĐỘT MULTER)

const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { isAuth } = require('../middleware/auth');
const { singleAvatarUpload } = require('../middleware/upload'); // Giữ lại middleware đã bọc

// --- CÁC ROUTE XÁC THỰC (GIỮ NGUYÊN) ---
router.post('/register', userController.register);
router.post('/login', userController.login);
router.post('/forgot-password', userController.forgotPassword);
router.post('/verify-otp', userController.verifyOtp);
router.post('/set-new-password', userController.setNewPassword);

// --- CÁC ROUTE USER/PROFILE ---

// Thống kê User cho Dashboard (Admin)
router.get('/get/analytics', userController.getUserAnalytics);

// 1. Upload Avatar: CHỈ SỬ DỤNG singleAvatarUpload (đã bao gồm Multer và logic bắt lỗi)
router.post(
    '/upload-avatar', 
    isAuth, 
    singleAvatarUpload, // ✨ FIX: CHỈ DÙNG middleware đã bọc Multer ✨
    userController.uploadAvatar
);

// 2. Các Route Yêu thích
router.get('/favorites', isAuth, userController.getFavorites); 
router.post('/favorite/toggle', isAuth, userController.toggleFavorite); 

// 3. Quản lý User (Admin)
router.get('/', userController.getUsers); 
router.delete('/:id', userController.deleteUser);

// 4. Cập nhật thông tin
router.put('/:id', isAuth, userController.updateUser); 

module.exports = router;