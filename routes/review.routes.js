// routes/review.routes.js

const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/review.controller');
const { isAuth } = require('../middleware/auth'); // Middleware kiểm tra đăng nhập

// POST /api/reviews -> Thêm bình luận (Cần đăng nhập)
router.post('/', isAuth, reviewController.addReview);

// GET /api/reviews/:productId -> Lấy danh sách bình luận (Không cần đăng nhập cũng xem được)
router.get('/:productId', reviewController.getReviewsByProduct);

module.exports = router;