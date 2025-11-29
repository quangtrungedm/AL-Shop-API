const Notification = require('../models/Notification.model');

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
    }
};


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
