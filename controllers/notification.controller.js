const Notification = require('../models/Notification.model');

<<<<<<< HEAD
// Retrieve notifications for the current user
exports.getNotifications = async (req, res) => {
    const userId = req.user.id; 

    try {
        const notifications = await Notification.find({ user: userId })
            .sort({ createdAt: -1 }) // Sort by newest first
            .limit(50); // Limit to the last 50 notifications

        res.json({ success: true, data: notifications });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ⭐️ NEW: Get count of unread notifications ⭐️
exports.getUnreadCount = async (req, res) => {
    const userId = req.user.id;

    try {
        // ⭐ USE countDocuments FOR PERFORMANCE ⭐
        const count = await Notification.countDocuments({ 
            user: userId, 
            read: false // Only count where 'read' status is false
        });
        
        res.json({ success: true, count: count });
    } catch (error) {
        console.error("ERROR GET_UNREAD_COUNT:", error.message);
        res.status(500).json({ success: false, message: "Failed to retrieve unread count." });
=======
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
        // Lấy notificationId từ params (chú ý tên param phải khớp với route)
        const { notificationId } = req.params; 
        
        await Notification.findByIdAndUpdate(notificationId, { read: true });
        res.status(200).json({ success: true, message: "Đã đọc." });
    } catch (error) {
        console.error("ERROR MARK_READ:", error);
        res.status(500).json({ success: false, message: "Lỗi server." });
>>>>>>> vinh2
    }
};

// 3. ⭐ HÀM MỚI: Đếm số lượng chưa đọc ⭐
const getUnreadCount = async (req, res) => {
    try {
        const userId = req.user._id;
        // Đếm số lượng document có user là userId và read là false
        const count = await Notification.countDocuments({ user: userId, read: false });
        
        res.status(200).json({ success: true, count: count });
    } catch (error) {
        console.error("ERROR COUNT_UNREAD:", error);
        res.status(500).json({ success: false, message: "Lỗi server khi đếm thông báo." });
    }
};

<<<<<<< HEAD
// Mark a notification as read
exports.markAsRead = async (req, res) => {
    const { notificationId } = req.params;
    const userId = req.user.id; 

    try {
        await Notification.findOneAndUpdate(
            { _id: notificationId, user: userId },
            { read: true },
            { new: true }
        );
        res.json({ success: true, message: 'Notification marked as read.' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
=======
// 👇 NHỚ EXPORT ĐỦ 3 HÀM 👇
module.exports = {
    getNotifications,
    markAsRead,
    getUnreadCount // <--- Thêm cái này vào
};
>>>>>>> vinh2
