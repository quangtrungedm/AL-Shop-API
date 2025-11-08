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
// ✅ Các route tĩnh phải ở trên route động
router.post('/favorite/toggle', authMiddleware, userController.toggleFavorite);
router.get('/favorites', authMiddleware, userController.getFavorites); 

// --- CÁC ROUTE QUẢN LÝ USER (CRUD) ---

// Route 1: Lấy danh sách users (GET /api/users) - Route tĩnh
router.get('/', userController.getUsers); 

// Route động: Cập nhật, Xóa, và Lấy thông tin 1 user theo ID
router
    .route('/:id') // Định nghĩa route động /:id một lần duy nhất
    .get(userController.getUserById)         // GET /api/users/:id
    .put(authMiddleware, userController.updateUser)   // PUT /api/users/:id
    .delete(authMiddleware, userController.deleteUser); // DELETE /api/users/:id

module.exports = router;