// [File] controllers/upload.controller.js (Đã fix lỗi URL kép)

const path = require('path');

const uploadAvatar = async (req, res) => {
    
    
    if (!req.file) {
        return res.status(400).json({ 
            success: false, 
            message: 'Không tìm thấy file ảnh hoặc file không đúng định dạng.' 
        });
    }

    // Lấy ID người dùng từ Auth Middleware
    // const userId = req.user && req.user.id ? req.user.id : 'guest'; // Giữ nguyên logic này

    // ⭐️ FIX: Trả về URL TƯƠNG ĐỐI (Relateive URL)
    // Frontend (account-settings.js) sẽ tự thêm Base URL (http://localhost:4000) vào
    const relativeUrl = `/uploads/avatars/${req.file.filename}`;
    
    // 3. Trả về URL ảnh mới cho Frontend
    res.status(200).json({
        success: true,
        message: 'Upload ảnh thành công.',
        url: relativeUrl, // ⭐️ Chỉ trả về phần tương đối
        filename: req.file.filename
    });
};


module.exports = {
    uploadAvatar
};