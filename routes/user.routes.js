const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
// IMPORT MIDDLEWARE
const { authMiddleware } = require('../middleware/auth'); 

// --- CÁC ROUTE XÁC THỰC (Auth) ---
router.post('/register', userController.register);
router.post('/login', userController.loginUser);

// --- CÁC ROUTE QUÊN MẬT KHẨU ---
router.post('/forgot-password', userController.forgotPassword);
router.post('/verify-otp', userController.verifyOtp);
router.post('/set-new-password', userController.setNewPassword);

// --- YÊU THÍCH (Favorites) ---
// 💡 QUAN TRỌNG: Đặt các route tĩnh này LÊN TRÊN route động /:id
router.post('/favorite/toggle', authMiddleware, userController.toggleFavorite);
router.get('/favorites', authMiddleware, userController.getFavorites); 

// --- CÁC ROUTE QUẢN LÝ USER (CRUD) ---
// Route tĩnh: Lấy danh sách users
router.get('/', userController.getUsers); 

// Route động: Cập nhật user theo ID
router.put('/:id', authMiddleware, userController.updateUser); 

// Route động: Xóa user theo ID
router.delete('/:id', authMiddleware, userController.deleteUser); 

// Route động: Lấy thông tin 1 user theo ID
router.get('/:id', userController.getUserById); // ✅ Đặt route động /:id này ở vị trí cuối

module.exports = router;