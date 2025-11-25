const Notification = require('../models/Notification.model');

// Lấy danh sách thông báo cho người dùng hiện tại
exports.getNotifications = async (req, res) => {
    const userId = req.user.id; 

    try {
        const notifications = await Notification.find({ user: userId })
            .sort({ createdAt: -1 }) // Thông báo mới nhất ở trên
            .limit(50); // Giới hạn 50 thông báo gần nhất

        res.json({ success: true, data: notifications });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ⭐️ HÀM MỚI: Đếm số thông báo chưa đọc ⭐️
exports.getUnreadCount = async (req, res) => {
    const userId = req.user.id;

    try {
        // ⭐ SỬ DỤNG countDocuments ĐỂ ĐẾM ⭐
        const count = await Notification.countDocuments({ 
            user: userId, 
            read: false // Chỉ đếm những thông báo có trường 'read' là false
        });
        
        res.json({ success: true, count: count });
    } catch (error) {
        console.error("ERROR GET_UNREAD_COUNT:", error.message);
        res.status(500).json({ success: false, message: "Failed to retrieve unread count." });
    }
};


// Đánh dấu thông báo đã đọc
exports.markAsRead = async (req, res) => {
    const { notificationId } = req.params;
    const userId = req.user.id; 

    try {
        await Notification.findOneAndUpdate(
            { _id: notificationId, user: userId },
            { read: true },
            { new: true }
        );
        res.json({ success: true, message: 'Thông báo đã được đánh dấu là đã đọc.' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};