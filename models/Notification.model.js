const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    // ID người dùng nhận thông báo (User hoặc Admin)
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true, // Nên bắt buộc để biết gửi cho ai
    },
    
    title: {
        type: String,
        required: true,
        trim: true,
    },
    
    description: {
        type: String,
        required: true,
    },
    
    // 👇 QUAN TRỌNG: Thêm 'NEW_ORDER', 'ORDER_UPDATE', 'NEW_COMMENT' vào enum
    type: {
        type: String,
        enum: [
            'ORDER_STATUS', // Báo cho khách: Đơn hàng thay đổi
            'NEW_PRODUCT',  // Báo chung: Có sản phẩm mới
            'PROMOTION',    // Khuyến mãi
            'SYSTEM',       // Hệ thống
            'NEW_ORDER',    // 🔔 Báo cho Admin: Có khách đặt hàng
            'ORDER_UPDATE', // Báo cho Admin: Đơn hoàn thành/hủy
            'NEW_COMMENT'   // Báo cho Admin: Có bình luận mới
        ],
        default: 'SYSTEM',
    },
    
    referenceId: {
        type: mongoose.Schema.Types.ObjectId,
        required: false,
    },
    
    // 👇 QUAN TRỌNG: Đổi tên thành 'isRead' để khớp với Frontend & Controller
    isRead: {
        type: Boolean,
        default: false,
    },
    
    image: {
        type: String,
        required: false,
    }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);