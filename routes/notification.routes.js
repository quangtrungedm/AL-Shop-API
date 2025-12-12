const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');
const { isAuth } = require('../middleware/auth'); 

// 1. Lấy danh sách (Kèm số lượng chưa đọc)
router.get('/', isAuth, notificationController.getNotifications); 

// 2. Chỉ lấy số lượng chưa đọc (Cho việc tự động refresh nhẹ nhàng)
router.get('/count', isAuth, notificationController.getUnreadCount); 

// 3. Đánh dấu Đọc tất cả
router.put('/read-all', isAuth, notificationController.markAllAsRead);

// 4. Đánh dấu Đọc 1 tin cụ thể (Đặt route động ở cuối để tránh trùng lặp)
router.put('/:id/read', isAuth, notificationController.markAsRead);

module.exports = router;