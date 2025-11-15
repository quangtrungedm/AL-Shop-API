const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const { isAuth } = require('../middleware/auth'); // Import Auth Middleware

// ⭐️ ROUTE MỚI: Lấy danh sách đơn hàng cho người dùng đã đăng nhập (Frontend)
router.get('/', isAuth, orderController.getOrdersByUser); 

// Thêm các routes Admin/Public (Nếu cần)
router.get('/all', orderController.getOrders); // Lấy tất cả (có thể cần Admin Auth)
router.post('/', isAuth, orderController.createOrder); // Yêu cầu đăng nhập để tạo
router.get('/:id', isAuth, orderController.getOrderById);
router.put('/:id', orderController.updateOrder);

module.exports = router;