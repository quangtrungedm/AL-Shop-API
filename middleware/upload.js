// [File] middleware/upload.js (ĐÃ SỬA CÚ PHÁP GỌI MULTER VÀ ERROR HANDLER)

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Đường dẫn tuyệt đối đến thư mục lưu trữ avatar
const AVATARS_DIR = path.join(__dirname, '../public/uploads/avatars');
 
// --- 1. Đảm bảo thư mục tồn tại ---
if (!fs.existsSync(AVATARS_DIR)) {
    fs.mkdirSync(AVATARS_DIR, { recursive: true });
}

// --- 2. Cấu hình nơi lưu trữ và tên file (diskStorage) ---
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, AVATARS_DIR); 
    },
    filename: function (req, file, cb) {
        // Giả định req.user được đặt bởi isAuth middleware
        const userId = req.user && req.user._id ? req.user._id.toString() : 'guest';
        const uniqueSuffix = Date.now();
        const ext = path.extname(file.originalname);
        
        cb(null, `${userId}-${uniqueSuffix}${ext}`); 
    }
});


// --- 3. Khai báo Multer Instance (Chưa gọi .single) ---
const uploadInstance = multer({ 
    storage: storage,
    limits: { fileSize: 2 * 1024 * 1024 }, // Giới hạn kích thước 2MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png/;
        const mimeType = allowedTypes.test(file.mimetype);
        const extName = allowedTypes.test(path.extname(file.originalname).toLowerCase());

        if (mimeType && extName) {
            return cb(null, true);
        } else {
            cb(new Error('Chỉ chấp nhận file ảnh (JPG, JPEG, PNG).'));
        }
    }
});

// ⭐️ Khai báo Middleware Multer đã được gọi .single('avatar') ⭐️
const singleAvatarMiddleware = uploadInstance.single('avatar');

// --- 4. Export Middleware đã được bọc (Wrapper) ---
const singleAvatarUpload = (req, res, next) => {
    // ⭐️ GỌI MIDDLEWARE MULTER ĐÃ ĐƯỢC ĐỊNH NGHĨA Ở TRÊN ⭐️
    singleAvatarMiddleware(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            console.error('Multer Error:', err.message);
            return res.status(400).json({ 
                success: false, 
                message: err.message === 'File too large' 
                    ? 'Kích thước file vượt quá 2MB.' 
                    : `Upload thất bại: ${err.message}` 
            });
        } 
        
        if (err) {
            console.error('Upload Error:', err.message);
            return res.status(400).json({ 
                success: false, 
                message: err.message 
            });
        }

        // Không có lỗi, tiếp tục middleware/controller tiếp theo
        next();
    });
};

module.exports = { singleAvatarUpload };