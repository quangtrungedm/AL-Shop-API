const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { isAuth } = require('../middleware/auth');
const uploadOptions = require('../helpers/upload-helper'); 
const { singleAvatarUpload } = require('../middleware/upload');
// --- CÁC ROUTE XÁC THỰC ---
router.post('/register', userController.register);
router.post('/login', userController.login);
router.post('/forgot-password', userController.forgotPassword);
router.post('/verify-otp', userController.verifyOtp);
router.post('/set-new-password', userController.setNewPassword);

// --- CÁC ROUTE USER/PROFILE ---

// 1. Upload Avatar
router.post('/upload-avatar', isAuth, uploadOptions.single('avatar'),singleAvatarUpload, userController.uploadAvatar);
// 2. Các Route Yêu thích
// 👇 ĐÃ SỬA: Route này khớp với lỗi 404 ở Frontend
router.get('/favorites', isAuth, userController.getFavorites); 
router.post('/favorite/toggle', isAuth, userController.toggleFavorite); 

// 3. Quản lý User (Admin)
router.get('/', userController.getUsers); 
router.delete('/:id', userController.deleteUser);

// 4. Cập nhật thông tin
router.put('/:id', isAuth, userController.updateUser); 

module.exports = router;