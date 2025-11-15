// [File] middleware/upload.js

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// --- 1. Đảm bảo thư mục tồn tại ---
const AVATARS_DIR = path.join(__dirname, '../public/uploads/avatars');

if (!fs.existsSync(AVATARS_DIR)) {
    // Sử dụng recursive: true để tạo các thư mục con nếu cần
    fs.mkdirSync(AVATARS_DIR, { recursive: true });
}

// --- 2. Cấu hình nơi lưu trữ và tên file (diskStorage) ---
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Luôn trả về thư mục lưu trữ đã được kiểm tra
        cb(null, AVATARS_DIR); 
    },
    filename: function (req, file, cb) {
        // Multer chạy sau isAuth, nên req.user đã tồn tại (nếu xác thực thành công).
        // Dùng .toString() cho _id để đảm bảo nó là chuỗi.
        const userId = req.user && req.user._id ? req.user._id.toString() : 'guest';
        const uniqueSuffix = Date.now();
        const ext = path.extname(file.originalname);
        
        // Tên file: userId-timestamp.ext
        cb(null, `${userId}-${uniqueSuffix}${ext}`); 
    }
});


// --- 3. Cấu hình Multer ---
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
            // Lỗi này sẽ được Multer xử lý và chuyển xuống next(err)
            cb(new Error('Chỉ chấp nhận file ảnh (JPG, JPEG, PNG).'));
        }
    }
});

// --- 4. Export Middleware ---
// Multer function đã được cấu hình cho việc upload 1 file (single) với field name là 'avatar'
const singleAvatarUpload = upload.single('avatar'); 

// Xuất dưới dạng đối tượng (cách bạn đã làm)
module.exports = { singleAvatarUpload };