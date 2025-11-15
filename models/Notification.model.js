const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    // ID người dùng nhận thông báo (required: false nếu là thông báo chung)
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false, 
    },
    // Tiêu đề ngắn gọn của thông báo (ví dụ: 'Đơn hàng #123 đã được xác nhận')
    title: {
        type: String,
        required: true,
        trim: true,
    },
    // Mô tả chi tiết (ví dụ: 'Sản phẩm của bạn đang được đóng gói.')
    description: {
        type: String,
        required: true,
    },
    // Loại thông báo (ví dụ: 'ORDER_STATUS', 'NEW_PRODUCT', 'PROMOTION')
    type: {
        type: String,
        enum: ['ORDER_STATUS', 'NEW_PRODUCT', 'PROMOTION', 'SYSTEM'],
        default: 'SYSTEM',
    },
    // ID liên quan đến thông báo (ví dụ: Order ID, Product ID)
    referenceId: {
        type: mongoose.Schema.Types.ObjectId,
        required: false,
    },
    // Trạng thái đã đọc hay chưa
    read: {
        type: Boolean,
        default: false,
    },
    // URL ảnh liên quan (ví dụ: ảnh sản phẩm)
    image: {
        type: String,
        required: false,
    }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);