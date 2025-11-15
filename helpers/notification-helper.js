const Notification = require('../models/Notification.model');

/**
 * Tạo và lưu một bản ghi thông báo mới vào cơ sở dữ liệu.
 * @param {string} userId - ID của người dùng nhận thông báo.
 * @param {string} title - Tiêu đề thông báo.
 * @param {string} description - Mô tả chi tiết.
 * @param {string} type - Loại thông báo (ORDER_STATUS, NEW_PRODUCT, etc.).
 * @param {string} [image] - URL hình ảnh (tùy chọn).
 * @param {mongoose.Types.ObjectId} [referenceId] - ID của đối tượng liên quan (tùy chọn).
 */
const createNotification = async ({ userId, title, description, type, image, referenceId }) => {
    try {
        const newNotification = new Notification({
            user: userId,
            title,
            description,
            type,
            image,
            referenceId,
            read: false,
        });

        await newNotification.save();
        console.log(`[Notification] Đã tạo thông báo mới cho user ${userId}: ${title}`);
        return newNotification;

    } catch (error) {
        console.error("ERROR: Không thể tạo thông báo mới:", error);
        return null; 
    }
};

module.exports = {
    createNotification
};