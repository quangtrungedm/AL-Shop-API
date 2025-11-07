const jwt = require('jsonwebtoken');
const User = require('../models/User.model'); 

exports.authMiddleware = async (req, res, next) => {
    // DEBUG 1: Log header Authorization
    console.log("DEBUG AUTH: Auth Header received:", req.headers.authorization);
    
    const authHeader = req.headers.authorization;
    let token;

    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
    }

    if (!token) {
        console.error("DEBUG AUTH: Token missing or format invalid. Returning 401."); 
        return res.status(401).json({ 
            success: false, 
            message: 'Không có token, từ chối truy cập.' 
        });
    }

    try {
        // Giải mã token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // DEBUG 2: Log ID User sau khi giải mã
        console.log("DEBUG AUTH: Token decoded successfully for User ID:", decoded.id);
        
        // Tìm user và loại trừ password
        const user = await User.findById(decoded.id).select('-password');

        if (!user) {
            console.error("DEBUG AUTH: User not found after decoding token.");
            return res.status(401).json({ 
                success: false, 
                message: 'Token hợp lệ nhưng người dùng không tồn tại.' 
            });
        }
        
        // Gắn object user (có thuộc tính _id) vào req
        req.user = user;
        
        // DEBUG 3: Xác nhận thành công và chuyển tiếp
        console.log(`DEBUG AUTH: User ${user._id} authenticated. Proceeding to controller.`);
        next(); 
        
    } catch (error) {
        // Xử lý lỗi JWT (Token hết hạn, sai chữ ký, format sai)
        let message = 'Token không hợp lệ hoặc đã hết hạn.';
        if (error.name === 'TokenExpiredError') {
            message = 'Token đã hết hạn.';
        } else if (error.name === 'JsonWebTokenError') {
            message = 'Token không hợp lệ.';
        }
        
        console.error("DEBUG AUTH FAILED:", error.message);
        res.status(401).json({ 
            success: false, 
            message: message 
        });
    }
};