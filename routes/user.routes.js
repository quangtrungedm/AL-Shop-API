const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { isAuth } = require('../middleware/auth');
// Giả sử bạn đã có middleware upload, nếu chưa có thì comment dòng dưới lại
const { singleAvatarUpload } = require('../middleware/upload'); 

// --- 1. CÁC ROUTE XÁC THỰC (AUTH) ---
router.post('/register', userController.register);
router.post('/login', userController.login);
router.post('/forgot-password', userController.forgotPassword);
router.post('/verify-otp', userController.verifyOtp);
router.post('/set-new-password', userController.setNewPassword);

// --- 2. CÁC ROUTE THỐNG KÊ & TIỆN ÍCH ---
// Thống kê User (Admin Dashboard)
router.get('/get/analytics', userController.getUserAnalytics);

// Upload Avatar (Nếu bạn chưa setup upload thì tạm comment dòng này để tránh lỗi)
router.post('/upload-avatar', isAuth, singleAvatarUpload, userController.uploadAvatar);

// Yêu thích
router.get('/favorites', isAuth, userController.getFavorites); 
router.post('/favorite/toggle', isAuth, userController.toggleFavorite); 

// --- 3. QUẢN LÝ USER (ADMIN) ---
router.get('/', userController.getUsers); 
router.delete('/:id', userController.deleteUser);

// --- 4. CẬP NHẬT THÔNG TIN (QUAN TRỌNG) ---

// 👇 Route này để sửa lỗi 404 nút Push Notification 👇
router.put('/:id/settings', isAuth, userController.updateUserSettings);

// 👇 Route này để sửa lỗi nút Update Profile 👇
router.put('/:id', isAuth, userController.updateUserProfile);

module.exports = router;