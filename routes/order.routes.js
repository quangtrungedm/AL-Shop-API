// File: routes/order.route.js

const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const { isAuth } = require('../middleware/auth'); 

// ==================================================================
// ⭐️ QUY TẮC VÀNG: ROUTE TĨNH (CỤ THỂ) PHẢI ĐẶT LÊN TRÊN ROUTE ĐỘNG (/:id)
// ==================================================================

// 1. Các Route Thống Kê & Analytics (Admin Dashboard)
router.get('/get/count-all', orderController.getTotalOrders);
router.get('/get/dashboard-stats', orderController.getDashboardStats);
router.get('/get/analytics', orderController.getRevenueAnalytics);
router.get('/get/order-analytics', orderController.getOrderAnalytics); // Đếm số đơn theo thời gian

// 2. Route Đếm (User App)
router.get('/count', isAuth, orderController.getOrderCount);

// 3. Route Lấy Danh Sách Đơn Hàng (QUAN TRỌNG)
// 👇 ĐÃ SỬA: Đưa route lấy đơn của User lên trên và đổi tên thành /get/userorders cho rõ ràng
router.get('/get/userorders', isAuth, orderController.getOrdersByUser); 

// Admin gọi /api/orders (không tham số) -> Lấy tất cả
router.get('/', orderController.getOrders); 

// 4. Tạo đơn hàng mới
router.post('/', isAuth, orderController.createOrder);

// 5. Cập nhật & Lấy chi tiết (Route động :id LUÔN LUÔN để cuối cùng)
// PUT /api/orders/:id -> Cập nhật trạng thái
router.put('/:id', isAuth, orderController.updateOrder); // Thêm isAuth nếu cần bảo mật

// GET /api/orders/:id -> Lấy chi tiết 1 đơn
router.get('/:id', isAuth, orderController.getOrderById);

module.exports = router;