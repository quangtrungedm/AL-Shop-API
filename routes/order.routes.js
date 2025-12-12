const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');

// 👇 1. Import Middleware vừa tạo
const { isAuth, isAdmin } = require('../middleware/auth'); 
if (!orderController) {
    console.error("❌ LỖI: Không import được order.controller.js");
}
router.get('/get/count-all', isAuth, isAdmin, orderController.getTotalOrders);
router.get('/get/dashboard-stats', isAuth, isAdmin, orderController.getDashboardStats);
router.get('/get/analytics', isAuth, isAdmin, orderController.getRevenueAnalytics);
router.get('/get/order-analytics', isAuth, isAdmin, orderController.getOrderVolumeAnalytics);
// Đếm số đơn của user
router.get('/count', isAuth, orderController.getOrderCount);
// Lấy danh sách đơn hàng của chính User đó
router.get('/get/userorders', isAuth, orderController.getOrdersByUser); 
// User tạo đơn hàng mới
router.post('/', isAuth, orderController.createOrder);
// Lấy TẤT CẢ đơn hàng (Chỉ Admin mới được xem hết)
router.get('/', isAuth, isAdmin, orderController.getOrders); 
// Cập nhật trạng thái đơn hàng (Admin duyệt đơn)
router.put('/:id', isAuth, isAdmin, orderController.updateOrder);
// Lấy chi tiết 1 đơn hàng (Cần đăng nhập để controller check quyền sở hữu)
router.get('/:id', isAuth, orderController.getOrderById);

module.exports = router;