// [File] server.js

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors'); // ⭐️ FIX 1: Đã require thư viện cors
const path = require('path'); 
const multer = require('multer'); // ⭐️ THÊM: Cần để bắt lỗi Multer

require('dotenv').config();

// Khai báo Routes
const userRoutes = require('./routes/user.routes');
const productRoutes = require('./routes/product.routes');
const orderRoutes = require('./routes/order.routes');
const uploadRoutes = require('./routes/upload.routes'); // Route upload file
const addressRoutes = require('./routes/address.routes');
const notificationRoutes = require('./routes/notification.routes');
// --- KHỞI TẠO APP EXPRESS ---
const app = express(); // ⭐️ FIX 2: Khai báo app trước khi sử dụng

// Logging (Kiểm tra biến môi trường)
console.log("JWT Secret đã tải:", process.env.JWT_SECRET ? '✅ Đã tải' : '❌ Lỗi chưa tải');


// --- MIDDLEWARE VÀ THỨ TỰ QUAN TRỌNG NHẤT ---

app.use(cors());

// ⭐️ FIX 3: ĐẶT ROUTE UPLOAD FILE TRƯỚC express.json()
// Multer phải được chạy trước để xử lý multipart/form-data, tránh bị express.json() làm hỏng body
app.use('/api/upload', uploadRoutes); 

// Body Parser cho các route còn lại (JSON data)
app.use(express.json());

// Cấu hình phục vụ File Tĩnh (ẢNH)
// File ảnh sẽ được truy cập qua /uploads/...
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads'))); 

// --- CÁC ROUTES CÒN LẠI ---

app.get('/', (req, res) => {
    res.json({
        message: 'AL-Shop API',
        version: '1.0.0',
        endpoints: {
            users: '/api/users',
            products: '/api/products',
            orders: '/api/orders',
            upload: '/api/upload' 
        }
    });
});

app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/notifications', notificationRoutes);
// --- KẾT NỐI MONGODB ---

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('--> ✅ Đã kết nối MongoDB'))
  .catch(err => console.log('❌ Lỗi kết nối MongoDB:', err));


// --- ERROR HANDLING CUỐI CÙNG ---

app.use((err, req, res, next) => {
    
    // ⭐️ Bắt lỗi Multer (ví dụ: File quá lớn, tên trường sai)
    if (err instanceof multer.MulterError) {
        return res.status(400).json({ 
            success: false, 
            message: `Lỗi tải file: ${err.message}. Kiểm tra kích thước file hoặc tên trường (phải là 'avatar').` 
        });
    }

    // Bắt lỗi từ fileFilter trong middleware/upload.js (định dạng ảnh)
    if (err.message === 'Chỉ chấp nhận file ảnh (JPG, JPEG, PNG).') {
        return res.status(400).json({ 
            success: false, 
            message: err.message 
        });
    }
    
    // Xử lý lỗi chung (Lỗi 500)
    console.error(err.stack);
    res.status(err.status || 500).json({ success: false, message: err.message || 'Lỗi Server nội bộ không xác định.' });
});


// --- KHỞI ĐỘNG SERVER ---

const PORT = process.env.PORT || 5001; // Sửa lỗi chính tả POƯRT -> PORT

app.listen(PORT, () => {
  console.log(`\n--> 🚀 Server đang chạy tại http://localhost:${PORT}`);
});