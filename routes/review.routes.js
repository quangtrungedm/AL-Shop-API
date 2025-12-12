const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/review.controller');
const { isAuth, isAdmin } = require('../middleware/auth');

// User & Public
router.post('/', isAuth, reviewController.addReview);
router.get('/:productId', reviewController.getReviewsByProduct);

// Admin Management
router.get('/', isAuth, isAdmin, reviewController.getAllReviews); // Lấy list quản lý
router.put('/:id/reply', isAuth, isAdmin, reviewController.replyReview); // Trả lời
router.put('/:id/status', isAuth, isAdmin, reviewController.toggleReviewStatus); // Ẩn/Hiện
router.delete('/:id', isAuth, isAdmin, reviewController.deleteReview); // Xóa

module.exports = router;