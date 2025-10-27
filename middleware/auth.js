const jwt = require('jsonwebtoken');
const User = require('../models/User.model'); // Kiểm tra đường dẫn này
const JWT_SECRET = process.env.JWT_SECRET;

// Đảm bảo bạn dùng "exports." (có "s")
exports.authMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'Không có token, từ chối truy cập' });
    }

    try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = await User.findById(decoded.id).select('-password');
        
        if (!req.user) {
             return res.status(404).json({ success: false, message: 'Không tìm thấy user' });
        }
        
        next(); 
    } catch (error) {
        res.status(401).json({ success: false, message: 'Token không hợp lệ' });
    }
};