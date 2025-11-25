// routes/admin.routes.js

const express = require('express');
const router = express.Router();
// Đảm bảo đường dẫn tới admin.controller.js là đúng
const adminController = require('../controllers/admin.controller'); 
// Đảm bảo import đúng isAuth và isAdmin từ middleware/auth.js
const { isAuth, isAdmin } = require('../middleware/auth'); 

// --- 1. ROUTE ĐĂNG NHẬP ADMIN (Không cần xác thực) ---
router.post('/login', adminController.loginAdmin); 

// --- 2. CÁC ROUTE QUẢN LÝ USER (Cần isAuth VÀ isAdmin) ---

// Lấy danh sách users
router.get('/users', isAuth, isAdmin, adminController.getUsers); 

// Cập nhật, Xóa, Lấy thông tin 1 user theo ID
router
    .route('/users/:id') 
    .get(isAuth, isAdmin, adminController.getUserById) // GET /api/admin/users/:id
    .put(isAuth, isAdmin, adminController.updateUser) // PUT /api/admin/users/:id
    .delete(isAuth, isAdmin, adminController.deleteUser); // DELETE /api/admin/users/:id


// Thêm các route quản lý Sản phẩm, Đơn hàng Admin khác tại đây...

module.exports = router;