// [File] controllers/upload.controller.js

const path = require('path');
// const User = require('../models/User.model'); // Uncomment nếu bạn muốn update DB tại đây

/**
 * Xử lý file đã được Multer upload.
 */
const uploadAvatar = async (req, res) => {
    
    // 1. Kiểm tra xem Multer có xử lý file thành công không
    if (!req.file) {
        return res.status(400).json({ 
            success: false, 
            message: 'Không tìm thấy file ảnh hoặc file không đúng định dạng.' 
        });
    }

    // Lấy ID người dùng từ Auth Middleware
    const userId = req.user && req.user.id ? req.user.id : 'guest';

    // 2. Tạo URL công khai 
    const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
    
    // URL công khai: BASE_URL/uploads/avatars/ten_file.jpg
    const publicUrl = `${baseUrl}/uploads/avatars/${req.file.filename}`;
    
    // 3. Trả về URL ảnh mới cho Frontend
    res.status(200).json({
        success: true,
        message: 'Upload ảnh thành công.',
        url: publicUrl,
        filename: req.file.filename
    });
};

// ⭐️ EXPORT CHUẨN ĐỂ KHỚP VỚI IMPORT DESTRUCTURING TRONG ROUTES
module.exports = {
    uploadAvatar
};