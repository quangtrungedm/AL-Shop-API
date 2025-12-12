const Notification = require('../models/Notification.model');

// 1. Lấy danh sách thông báo (Kèm số lượng chưa đọc)
const getNotifications = async (req, res) => {
    try {
        const userId = req.user._id; 
        
        // Lấy 20 thông báo mới nhất
        const notifications = await Notification.find({ user: userId })
            .sort({ createdAt: -1 })
            .limit(20); 

        // Đếm số lượng chưa đọc (isRead: false)
        const unreadCount = await Notification.countDocuments({ user: userId, isRead: false });
        
        res.status(200).json({ 
            success: true, 
            data: notifications,
            unreadCount: unreadCount // Trả về luôn để hiển thị badge đỏ
        });
    } catch (error) {
        console.error("ERROR GET_NOTIFICATIONS:", error);
        res.status(500).json({ success: false, message: "Lỗi server lấy thông báo." });
    }
};

// 2. Đánh dấu 1 tin là đã đọc
const markAsRead = async (req, res) => {
    try {
        const { id } = req.params; // Lấy ID từ URL
        
        await Notification.findByIdAndUpdate(id, { isRead: true });
        
        res.status(200).json({ success: true, message: "Đã đánh dấu đã đọc." });
    } catch (error) {
        console.error("ERROR MARK_READ:", error);
        res.status(500).json({ success: false, message: "Lỗi server." });
    }
};

// 3. Đánh dấu TẤT CẢ là đã đọc
const markAllAsRead = async (req, res) => {
    try {
        const userId = req.user._id;
        
        // Cập nhật tất cả thông báo của user này thành isRead: true
        await Notification.updateMany(
            { user: userId, isRead: false },
            { isRead: true }
        );

        res.status(200).json({ success: true, message: "Đã đọc tất cả." });
    } catch (error) {
        console.error("ERROR MARK_ALL_READ:", error);
        res.status(500).json({ success: false, message: "Lỗi server." });
    }
};

// 4. API chỉ để đếm số lượng (Dùng cho polling/auto refresh nhẹ)
const getUnreadCount = async (req, res) => {
    try {
        const userId = req.user._id;
        const count = await Notification.countDocuments({ user: userId, isRead: false });
        
        res.status(200).json({ success: true, count: count });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi đếm thông báo." });
    }
};

module.exports = {
    getNotifications,
    markAsRead,
    markAllAsRead,
    getUnreadCount
};