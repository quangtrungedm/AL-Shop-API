// [File] routes/user.route.js

const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { isAuth } = require('../middleware/auth');
const uploadOptions = require('../helpers/upload-helper'); // Dùng chung helper với Product

// --- CÁC ROUTE XÁC THỰC ---
router.post('/register', userController.register);
router.post('/login', userController.login);
router.post('/forgot-password', userController.forgotPassword);
router.post('/verify-otp', userController.verifyOtp);
router.post('/set-new-password', userController.setNewPassword);

// --- CÁC ROUTE USER/PROFILE ---

// 1. Upload Avatar (Dùng Multer)
// POST /api/users/upload-avatar
router.post('/upload-avatar', isAuth, uploadOptions.single('avatar'), userController.uploadAvatar);

// 2. Các Route Yêu thích
router.get('/favorites', isAuth, userController.getFavorites);
router.post('/favorites', isAuth, userController.toggleFavorite);

// 3. Quản lý User (Admin)
// GET /api/users -> Lấy danh sách
router.get('/', userController.getUsers); 
// DELETE /api/users/:id -> Xóa user
router.delete('/:id', userController.deleteUser);

// 4. Cập nhật thông tin (Để cuối vì có :id)
router.put('/:id', isAuth, userController.updateUser); 

module.exports = router;