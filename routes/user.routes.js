const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');

<<<<<<< HEAD
router.post('/register', userController.register);
router.get('/', userController.getUsers);
router.post('/', userController.createUser);
router.get('/:id', userController.getUserById);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);
router.post('/forgot-password', userController.forgotPassword);
router.post('/verify-otp', userController.verifyOtp);
router.post('/set-new-password', userController.setNewPassword);
=======
// IMPORT MIDDLEWARE
const { authMiddleware } = require('../middleware/auth'); 
>>>>>>> f44a70b (API: Hoàn thành chức năng Yêu thích và Auth (Login/Register))

// --- CÁC ROUTE MỚI ---
router.post('/login', userController.loginUser); // Route đăng nhập
router.put(
    '/favorites/:productId', 
    authMiddleware,  // Áp dụng bảo vệ
    userController.toggleFavorite 
);

// --- CÁC ROUTE CŨ ---
router.get('/', userController.getUsers);
router.post('/', userController.createUser); // Route đăng ký
router.get('/:id', userController.getUserById);
router.put('/:id', authMiddleware, userController.updateUser); // Bảo vệ
router.delete('/:id', authMiddleware, userController.deleteUser); // Bảo vệ

module.exports = router;