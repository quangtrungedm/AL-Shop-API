// [File] middleware/upload.js

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Đảm bảo thư mục lưu trữ tồn tại
// Tên thư mục cần phải chính xác
const AVATARS_DIR = path.join(__dirname, '../public/uploads/avatars');

if (!fs.existsSync(AVATARS_DIR)) {
    // Nếu thư mục chưa có, tạo mới (recursive: true giúp tạo cả các thư mục cha nếu cần)
    fs.mkdirSync(AVATARS_DIR, { recursive: true });
}

// Cấu hình nơi lưu trữ và tên file
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Nơi lưu trữ cuối cùng: public/uploads/avatars
        cb(null, AVATARS_DIR); 
    },
    filename: function (req, file, cb) {
        // Lấy userId từ token (sau khi authMiddleware chạy)
        // Nếu không có req.user, sử dụng 'guest'
        const userId = req.user && req.user.id ? req.user.id : 'guest';
        const uniqueSuffix = Date.now();
        const ext = path.extname(file.originalname);
        
        // Tên file: userId-timestamp.ext
        cb(null, `${userId}-${uniqueSuffix}${ext}`); 
    }
});

// Cấu hình Multer: chấp nhận 1 file ảnh có tên 'avatar'
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 2 * 1024 * 1024 }, // Giới hạn kích thước 2MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png/;
        const mimeType = allowedTypes.test(file.mimetype);
        const extName = allowedTypes.test(path.extname(file.originalname).toLowerCase());

        if (mimeType && extName) {
            return cb(null, true);
        } else {
            // Xử lý lỗi file không đúng định dạng
            cb(new Error('Chỉ chấp nhận file ảnh (JPG, JPEG, PNG).'));
        }
    }
}).single('avatar'); // Tên trường file trong FormData từ Frontend là 'avatar'

module.exports = upload;