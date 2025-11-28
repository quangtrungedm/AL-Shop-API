// helpers/upload-helper.js
const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Bản đồ định dạng file cho phép
const FILE_TYPE_MAP = {
    'image/png': 'png',
    'image/jpeg': 'jpeg',
    'image/jpg': 'jpg'
};

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const isValid = FILE_TYPE_MAP[file.mimetype];
        let uploadError = new Error('Sai định dạng ảnh (chỉ chấp nhận .png, .jpeg, .jpg)');

        if (isValid) {
            uploadError = null;
        }
        
        // ⭐️ Đường dẫn lưu ảnh: Thư mục gốc/public/uploads
        const uploadPath = path.join(__dirname, '../public/uploads');
        
        // Tạo thư mục nếu chưa tồn tại
        if (!fs.existsSync(uploadPath)){
            fs.mkdirSync(uploadPath, { recursive: true });
        }

        cb(uploadError, uploadPath); 
    },
    filename: function (req, file, cb) {
        // Tạo tên file duy nhất: tên-gốc-thời-gian.đuôi
        const fileName = file.originalname.split(' ').join('-');
        const extension = FILE_TYPE_MAP[file.mimetype];
        cb(null, `${fileName}-${Date.now()}.${extension}`);
    }
});

const uploadOptions = multer({ storage: storage });

module.exports = uploadOptions;