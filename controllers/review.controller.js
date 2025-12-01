// controllers/review.controller.js

const Review = require('../models/Review.model');
const Product = require('../models/Product.model');

// 1. Thêm bình luận mới
const addReview = async (req, res) => {
    try {
        const { productId, rating, comment } = req.body;
        const userId = req.user._id; // Lấy từ token

        // Validate cơ bản
        if (!productId || !rating || !comment) {
            return res.status(400).json({ success: false, message: 'Vui lòng nhập đủ thông tin.' });
        }

        // Tạo review mới
        const newReview = new Review({
            user: userId,
            product: productId,
            rating: Number(rating),
            comment
        });

        await newReview.save();

        // --- CẬP NHẬT ĐIỂM ĐÁNH GIÁ TRUNG BÌNH CHO SẢN PHẨM ---
        // (Tính toán lại số sao trung bình để hiển thị ngoài trang chủ)
        const reviews = await Review.find({ product: productId });
        const totalRating = reviews.reduce((acc, item) => acc + item.rating, 0);
        const avgRating = (totalRating / reviews.length).toFixed(1); // Làm tròn 1 số lẻ

        // Update vào Product (Giả sử Product model có trường rating, nếu chưa có thì bỏ qua bước này)
        // await Product.findByIdAndUpdate(productId, { rating: avgRating, numReviews: reviews.length });

        // Populate thông tin user để trả về cho frontend hiển thị ngay
        await newReview.populate('user', 'name avatar');

        res.status(201).json({ 
            success: true, 
            message: 'Đánh giá thành công!', 
            data: newReview 
        });

    } catch (error) {
        console.error("ERROR ADD_REVIEW:", error);
        res.status(500).json({ success: false, message: 'Lỗi server khi đánh giá.' });
    }
};

// 2. Lấy danh sách bình luận của 1 sản phẩm
const getReviewsByProduct = async (req, res) => {
    try {
        const { productId } = req.params;

        const reviews = await Review.find({ product: productId })
            .populate('user', 'name avatar') // Lấy tên và avatar người bình luận
            .sort({ createdAt: -1 }); // Mới nhất lên đầu

        res.status(200).json({ success: true, data: reviews });
    } catch (error) {
        console.error("ERROR GET_REVIEWS:", error);
        res.status(500).json({ success: false, message: 'Lỗi server tải bình luận.' });
    }
};

module.exports = {
    addReview,
    getReviewsByProduct
};