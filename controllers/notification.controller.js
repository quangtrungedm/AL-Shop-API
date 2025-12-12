const Notification = require('../models/Notification.model');

// 1. Lấy danh sách thông báo
const getNotifications = async (req, res) => {
    try {
        const userId = req.user._id; 
        
        const notifications = await Notification.find({ user: userId })
            .sort({ createdAt: -1 })
            .limit(50); // Giới hạn 50 tin mới nhất

        const unreadCount = await Notification.countDocuments({ user: userId, isRead: false });
        
        res.status(200).json({ 
            success: true, 
            data: notifications,
            unreadCount: unreadCount 
        });
    } catch (error) {
        console.error("GET NOTI ERROR:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// 2. Đánh dấu 1 tin đã đọc
const markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        await Notification.findByIdAndUpdate(id, { isRead: true });
        res.status(200).json({ success: true, message: "Marked as read" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// 3. Đánh dấu tất cả đã đọc
const markAllAsRead = async (req, res) => {
    try {
        const userId = req.user._id;
        await Notification.updateMany(
            { user: userId, isRead: false },
            { isRead: true }
        );
        res.status(200).json({ success: true, message: "All marked as read" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// 4. Lấy số lượng chưa đọc (Cho polling nhẹ)
const getUnreadCount = async (req, res) => {
    try {
        const userId = req.user._id;
        const count = await Notification.countDocuments({ user: userId, isRead: false });
        res.status(200).json({ success: true, count });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// ⭐️ QUAN TRỌNG: PHẢI EXPORT ĐẦY ĐỦ ⭐️
module.exports = {
    getNotifications,
    markAsRead,
    markAllAsRead,
    getUnreadCount
};