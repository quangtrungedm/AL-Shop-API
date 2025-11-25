const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');
const { isAuth } = require('../middleware/auth'); 

// GET /api/notifications
router.get('/', isAuth, notificationController.getNotifications); 

// ⭐ FIX: Thêm route để lấy số lượng thông báo chưa đọc
// GET /api/notifications/count
router.get('/count', isAuth, notificationController.getUnreadCount); 

// PUT /api/notifications/:notificationId/read
router.put('/:notificationId/read', isAuth, notificationController.markAsRead);

module.exports = router;