const Notification = require('../models/Notification.model');

// 1. Lấy danh sách thông báo
const getNotifications = async (req, res) => {
    try {
        const userId = req.user._id; 
        const notifications = await Notification.find({ user: userId })
            .sort({ createdAt: -1 })
            .limit(50); 
        res.status(200).json({ success: true, data: notifications });
    } catch (error) {
        console.error("ERROR GET_NOTIFICATIONS:", error);
        res.status(500).json({ success: false, message: "Lỗi server." });
    }
};

// 2. Đánh dấu đã đọc
const markAsRead = async (req, res) => {
    try {
        const notificationId = req.params.notificationId || req.params.id;
        
        await Notification.findByIdAndUpdate(notificationId, { read: true });
        res.status(200).json({ success: true, message: "Đã đọc." });
    } catch (error) {
        console.error("ERROR MARK_READ:", error);
        res.status(500).json({ success: false, message: "Lỗi server." });
    }
};

// 3. Đếm số lượng chưa đọc
const getUnreadCount = async (req, res) => {
    try {
        const userId = req.user._id;
        const count = await Notification.countDocuments({ user: userId, read: false });
        
        res.status(200).json({ success: true, count: count });
    } catch (error) {
        console.error("ERROR COUNT_UNREAD:", error);
        res.status(500).json({ success: false, message: "Lỗi server khi đếm thông báo." });
    }
};

module.exports = {
    getNotifications,
    markAsRead,
    getUnreadCount
};