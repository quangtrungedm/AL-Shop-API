// [File] controllers/upload.controller.js

const path = require('path');
const User = require('../models/User.model'); // Cần User Model để lấy BASE_URL/Id

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
    const userId = req.user && req.user._id;

    // 2. Tạo URL công khai 
    // LƯU Ý: Đảm bảo biến môi trường BASE_URL đã được thiết lập (ví dụ: http://localhost:4000)
    const baseUrl = process.env.BASE_URL || 'http://localhost:4000';
    
    // URL công khai: BASE_URL/uploads/avatars/ten_file.jpg
    // Cần dùng replace để đảm bảo đường dẫn trên Windows/Linux đều hợp lệ cho URL
    const publicPath = req.file.path.replace(/\\/g, '/');
    const publicUrl = `${baseUrl}${publicPath.split('public')[1]}`; // Lấy phần sau /public

    
    // 3. Cập nhật URL avatar mới vào DB (tùy chọn, nên làm)
    if (userId) {
        await User.findByIdAndUpdate(userId, { avatar: publicUrl });
    }

    // 4. Trả về URL ảnh mới cho Frontend
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