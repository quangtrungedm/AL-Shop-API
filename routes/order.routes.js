// File: routes/order.route.js

const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const { isAuth } = require('../middleware/auth'); 

// ==================================================================
// ⭐️ QUY TẮC VÀNG: ROUTE TĨNH (CỤ THỂ) PHẢI ĐẶT LÊN TRÊN ROUTE ĐỘNG (/:id)
// ==================================================================

// 1. Các Route Thống Kê & Analytics (Dành cho Admin Dashboard)
router.get('/get/count-all', orderController.getTotalOrders);
router.get('/get/dashboard-stats', orderController.getDashboardStats);
router.get('/get/analytics', orderController.getRevenueAnalytics);

// 2. Route Đếm (Dành cho User App)
router.get('/count', isAuth, orderController.getOrderCount);

// 3. Route Lấy Danh Sách Đơn Hàng (QUAN TRỌNG)
// Admin gọi /api/orders (không tham số) -> Lấy tất cả
// User gọi /api/orders/my-orders -> Lấy đơn của mình (để tránh xung đột logic)
router.get('/', orderController.getOrders); // Admin lấy tất cả
router.get('/my-orders', isAuth, orderController.getOrdersByUser); // User lấy đơn của mình

// 4. Tạo đơn hàng mới
router.post('/', isAuth, orderController.createOrder);

// 5. Cập nhật & Lấy chi tiết (Route động luôn để cuối cùng)
// PUT /api/orders/:id -> Cập nhật trạng thái
router.put('/:id', orderController.updateOrder); 

// GET /api/orders/:id -> Lấy chi tiết 1 đơn
router.get('/:id', isAuth, orderController.getOrderById);

module.exports = router;