const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
// IMPORT MIDDLEWARE
const { authMiddleware } = require('../middleware/auth'); 

// === CÁC ROUTE VỀ XÁC THỰC (Auth) ===
router.post('/register', userController.register);
router.post('/login', userController.loginUser);

// === CÁC ROUTE QUÊN MẬT KHẨU ===
router.post('/forgot-password', userController.forgotPassword);
router.post('/verify-otp', userController.verifyOtp);
router.post('/set-new-password', userController.setNewPassword);


// === CÁC ROUTE QUẢN LÝ USER (CRUD) ===
router.get('/', userController.getUsers);
router.get('/:id', userController.getUserById);

// ROUTE CẬP NHẬT (SẼ XỬ LÝ PHONE VÀ ADDRESS)
router.put('/:id', authMiddleware, userController.updateUser); 

router.delete('/:id', authMiddleware, userController.deleteUser); 


// === YÊU THÍCH (Favorites) ===
router.post('/favorite/toggle', authMiddleware, userController.toggleFavorite);
router.get('/favorites', authMiddleware, userController.getFavorites);

module.exports = router;