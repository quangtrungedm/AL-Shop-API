// models/Review.model.js

const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    // Người đánh giá
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // Sản phẩm được đánh giá
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    // Điểm sao (1 - 5)
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    // Nội dung bình luận
    comment: {
        type: String,
        required: true,
        trim: true
    }
}, { timestamps: true });

// Đảm bảo 1 người chỉ đánh giá 1 sản phẩm 1 lần (Tùy chọn, nếu muốn)
// reviewSchema.index({ user: 1, product: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);