// [File] routes/user.route.js

const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { isAuth } = require('../middleware/auth');

// --- CÁC ROUTE XÁC THỰC ---
router.post('/register', userController.register);
router.post('/login', userController.login);
router.post('/forgot-password', userController.forgotPassword);
router.post('/verify-otp', userController.verifyOtp);
router.post('/set-new-password', userController.setNewPassword);

// --- CÁC ROUTE USER/PROFILE ---
// PUT /api/users/:id - Cập nhật thông tin User
// Cần isAuth để kiểm tra quyền và lấy req.user
router.put('/:id', isAuth, userController.updateUser); 
// GET /api/users/favorites - Lấy danh sách yêu thích
router.get('/favorites', isAuth, userController.getFavorites);
// POST /api/users/favorites - Thêm/Xóa sản phẩm yêu thích
router.post('/favorites', isAuth, userController.toggleFavorite);


module.exports = router;