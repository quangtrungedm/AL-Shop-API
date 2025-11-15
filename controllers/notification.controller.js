const Notification = require('../models/Notification.model');

// Lấy danh sách thông báo cho người dùng hiện tại
exports.getNotifications = async (req, res) => {
    const userId = req.user.id; 

    try {
        const notifications = await Notification.find({ user: userId })
            .sort({ createdAt: -1 }) // Thông báo mới nhất ở trên
            .limit(50); // Giới hạn 50 thông báo gần nhất
        
        // Bạn có thể đánh dấu thông báo là đã đọc ở đây nếu muốn
        // await Notification.updateMany({ user: userId, read: false }, { read: true });

        res.json({ success: true, data: notifications });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
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