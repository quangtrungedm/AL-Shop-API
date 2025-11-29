// [File] middleware/upload.js

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Đường dẫn tuyệt đối đến thư mục lưu trữ avatar
const AVATARS_DIR = path.join(__dirname, '../public/uploads/avatars');
 
// --- 1. Đảm bảo thư mục tồn tại ---
if (!fs.existsSync(AVATARS_DIR)) {
    // Sử dụng recursive: true để tạo các thư mục con nếu cần
    fs.mkdirSync(AVATARS_DIR, { recursive: true });
}

// --- 2. Cấu hình nơi lưu trữ và tên file (diskStorage) ---
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, AVATARS_DIR); 
    },
    filename: function (req, file, cb) {
        // Dùng .toString() cho _id để đảm bảo nó là chuỗi.
        // req.user được thiết lập bởi middleware isAuth trước đó.
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
            cb(new Error('Chỉ chấp nhận file ảnh (JPG, JPEG, PNG).'));
        }
    }
});

// --- 4. Export Middleware ---
const singleAvatarUpload = upload.single('avatar'); 

module.exports = { singleAvatarUpload };
