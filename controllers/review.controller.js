const Review = require('../models/Review.model');
const Product = require('../models/Product.model');
const User = require('../models/User.model');
const { createNotification } = require('../helpers/notification-helper');

// 1. Thêm đánh giá (User) -> Báo cho Admin
const addReview = async (req, res) => {
    try {
        const { productId, rating, comment } = req.body;
        const userId = req.user._id;

        // Tạo review
        const newReview = await Review.create({
            user: userId,
            product: productId,
            rating: Number(rating),
            comment
        });

        // --- GỬI THÔNG BÁO CHO ADMIN ---
        const user = await User.findById(userId).select('name');
        const product = await Product.findById(productId).select('name image');
        const productImage = product?.image?.[0] || null;

        // Tìm Admin đang bật thông báo
        const admins = await User.find({ role: 'admin', 'settings.pushNotifications': true });

        if (admins.length > 0) {
            admins.forEach(admin => {
                createNotification({
                    userId: admin._id,
                    title: `💬 New Review: ${rating}⭐`,
                    description: `${user.name} just reviewed "${product.name}".`,
                    type: 'NEW_COMMENT', // Loại này sẽ điều hướng về trang Comments
                    referenceId: newReview._id,
                    image: productImage
                });
            });
        }

        res.status(201).json({ success: true, message: 'Review added successfully!', data: newReview });

    } catch (error) {
        // Bắt lỗi trùng lặp (đã đánh giá rồi)
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'You have already reviewed this product.' });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

// 2. Lấy đánh giá theo sản phẩm (Public) - Chỉ lấy cái đang hiện (isActive: true)
const getReviewsByProduct = async (req, res) => {
    try {
        const reviews = await Review.find({ product: req.params.productId, isActive: true })
            .populate('user', 'name avatar')
            .sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: reviews });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 3. ADMIN: Lấy TẤT CẢ đánh giá (để quản lý)
const getAllReviews = async (req, res) => {
    try {
        const reviews = await Review.find()
            .populate('user', 'name email')
            .populate('product', 'name image')
            .sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: reviews });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 4. ADMIN: Trả lời đánh giá
const replyReview = async (req, res) => {
    try {
        const { reply } = req.body;
        const review = await Review.findByIdAndUpdate(
            req.params.id,
            { reply: reply },
            { new: true }
        );
        res.status(200).json({ success: true, message: 'Replied.', data: review });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 5. ADMIN: Ẩn/Hiện đánh giá (Kiểm duyệt)
const toggleReviewStatus = async (req, res) => {
    try {
        const { isActive } = req.body;
        const review = await Review.findByIdAndUpdate(
            req.params.id,
            { isActive: isActive },
            { new: true }
        );
        res.status(200).json({ success: true, message: 'Status updated.', data: review });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 6. ADMIN: Xóa đánh giá
const deleteReview = async (req, res) => {
    try {
        await Review.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, message: 'Review deleted.' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    addReview,
    getReviewsByProduct,
    getAllReviews,
    replyReview,
    toggleReviewStatus,
    deleteReview
};