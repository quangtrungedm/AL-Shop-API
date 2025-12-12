const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/category.controller');

// Đảm bảo controller đã được import đúng
if (!categoryController) {
    console.error("❌ LỖI: Không tìm thấy file category.controller.js");
}

// --- CÁC ROUTE ---
router.get('/', categoryController.getCategories);        // Lấy danh sách
router.get('/:id', categoryController.getCategoryById);   // Lấy chi tiết
router.post('/', categoryController.createCategory);      // Tạo mới

// 👇 2 ROUTE PUT QUAN TRỌNG 👇
router.put('/:id', categoryController.updateCategory);        // Sửa tên (Nút Lưu hoạt động nhờ dòng này)
router.put('/:id/status', categoryController.toggleStatus);   // Ẩn/Hiện
module.exports = router;