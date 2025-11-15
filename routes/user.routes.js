const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
// ĐÃ SỬA: Import 'isAuth' để khớp với export trong middleware/auth.js
const { isAuth } = require('../middleware/auth'); 

// --- CÁC ROUTE XÁC THỰC (Auth) ---
router.post('/register', userController.register);
router.post('/login', userController.loginUser);

// --- CÁC ROUTE QUÊN MẬT KHẨU ---
router.post('/forgot-password', userController.forgotPassword);
router.post('/verify-otp', userController.verifyOtp);
router.post('/set-new-password', userController.setNewPassword);

// --- YÊU THÍCH (Favorites) ---
// SỬ DỤNG isAuth đã import
router.post('/favorite/toggle', isAuth, userController.toggleFavorite);
router.get('/favorites', isAuth, userController.getFavorites); 

// --- CÁC ROUTE QUẢN LÝ USER (CRUD) ---

// Route 1: Lấy danh sách users (GET /api/users) - Route tĩnh
router.get('/', userController.getUsers); 

// Route động: Cập nhật, Xóa, và Lấy thông tin 1 user theo ID
router
    .route('/:id') // Định nghĩa route động /:id một lần duy nhất
    .get(userController.getUserById)         // GET /api/users/:id
    // SỬ DỤNG isAuth đã import
    .put(isAuth, userController.updateUser)   // PUT /api/users/:id
    .delete(isAuth, userController.deleteUser); // DELETE /api/users/:id

module.exports = router;