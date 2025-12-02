// helpers/upload-helper.js
const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Map of allowed file MIME types
const FILE_TYPE_MAP = {
    'image/png': 'png',
    'image/jpeg': 'jpeg',
    'image/jpg': 'jpg'
};

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const isValid = FILE_TYPE_MAP[file.mimetype];
        
        // Define error for invalid file types
        let uploadError = new Error('Sai định dạng ảnh (chỉ chấp nhận .png, .jpeg, .jpg)');

        if (isValid) {
            uploadError = null;
        }
        
        // ⭐️ Upload path: Root directory/public/uploads
        const uploadPath = path.join(__dirname, '../public/uploads');
        
        // Create the directory if it does not exist
        if (!fs.existsSync(uploadPath)){
            fs.mkdirSync(uploadPath, { recursive: true });
        }

        cb(uploadError, uploadPath); 
    },
    filename: function (req, file, cb) {
        // Generate unique filename: original-name-timestamp.extension
        const fileName = file.originalname.split(' ').join('-');
        const extension = FILE_TYPE_MAP[file.mimetype];
        cb(null, `${fileName}-${Date.now()}.${extension}`);
    }
});

const uploadOptions = multer({ storage: storage });

module.exports = uploadOptions;
