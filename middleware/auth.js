// middleware/auth.js

const jwt = require('jsonwebtoken');
const User = require('../models/User.model'); 

// 1. MIDDLEWARE XÁC THỰC (isAuth)
const isAuth = async (req, res, next) => {
    console.log("DEBUG AUTH: Auth Header received:", req.headers.authorization);
    
    const authHeader = req.headers.authorization;
    let token;

    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
    }

    // ⭐️ FIX LỖI: Kiểm tra token rỗng, null, hoặc chuỗi "undefined" ⭐️
    if (!token || token === 'undefined') { 
        console.error("DEBUG AUTH: Token missing, empty, or 'undefined'. Returning 401."); 
        return res.status(401).json({ 
            success: false, 
            message: 'Không có mã xác thực hoặc mã không hợp lệ.' 
        });
    }

    try {
        // Giải mã token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
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
        
        // Gán thông tin user vào request
        req.user = user;
        
        console.log(`DEBUG AUTH: User ${user._id} authenticated. Proceeding to controller.`);
        next(); 
        
    } catch (error) {
        // ⭐️ FIX LỖI: Xử lý lỗi JWT cho các trường hợp cụ thể ⭐️
        let message;
        if (error.name === 'TokenExpiredError') {
            message = 'Token đã hết hạn.';
        } else if (error.name === 'JsonWebTokenError') {
             // Bắt các lỗi format sai, chữ ký sai, hoặc token là chuỗi rỗng
            message = 'Token không hợp lệ (Sai định dạng/Chữ ký).'; 
        } else {
             message = 'Lỗi xác thực không xác định.';
        }
        
        console.error("DEBUG AUTH FAILED:", error.message);
        res.status(401).json({ 
            success: false, 
            message: message 
        });
    }
};

// 2. MIDDLEWARE KIỂM TRA QUYỀN ADMIN (isAdmin)
// Middleware này cần được gọi SAU isAuth
const isAdmin = (req, res, next) => {
    // req.user phải tồn tại từ isAuth
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        console.warn(`ACCESS DENIED: User ${req.user?._id || 'Unknown'} (Role: ${req.user?.role || 'None'}) tried to access Admin route.`);
        return res.status(403).json({ 
            success: false, 
            message: 'Bạn không có quyền quản trị.' 
        });
    }
};

module.exports = {
    isAuth,
    isAdmin, // ⭐️ ĐÃ BỔ SUNG ⭐️
};