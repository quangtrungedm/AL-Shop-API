// File: routes/order.route.js (ĐÃ FIX LỖI XUNG ĐỘT ROUTE)

const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const { isAuth } = require('../middleware/auth'); 

// ------------------------------------------------------------------
// ⭐ QUAN TRỌNG: ROUTES TĨNH VÀ CỤ THỂ PHẢI ĐẶT LÊN TRÊN
// ------------------------------------------------------------------

// 1. ✅ FIX LỖI: Route /count (Tĩnh) phải đứng đầu tiên
router.get('/count', isAuth, orderController.getOrderCount);

// 2. Route /all (Tĩnh)
router.get('/all', orderController.getOrders); 

// ------------------------------------------------------------------
// ⭐ PHẦN CÒN LẠI: Route Chung, Post, Put, và Động
// ------------------------------------------------------------------

// 3. Route GỐC: /api/orders (Lấy danh sách cho user hiện tại)
router.get('/', isAuth, orderController.getOrdersByUser); 

// 4. Post/Put
router.post('/', isAuth, orderController.createOrder);
router.put('/:id', orderController.updateOrder);

// 5. 🚨 Route ĐỘNG (/:id) phải đặt CUỐI CÙNG trong nhóm GET
router.get('/:id', isAuth, orderController.getOrderById);

module.exports = router;