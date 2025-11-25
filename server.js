// [File] server.js - ĐÃ XÁC NHẬN VÀ GIỮ NGUYÊN THỨ TỰ MIDDLEWARE CHÍNH XÁC

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors'); 
const path = require('path'); 
const multer = require('multer'); 

const bcrypt = require('bcrypt');
const User = require('./models/User.model');

require('dotenv').config();

// Khai báo Routes
const userRoutes = require('./routes/user.routes');
const adminRoutes = require('./routes/admin.route'); 
const productRoutes = require('./routes/product.routes');
const orderRoutes = require('./routes/order.routes');
const uploadRoutes = require('./routes/upload.routes');
const addressRoutes = require('./routes/address.routes');
const notificationRoutes = require('./routes/notification.routes');

// --- KHỞI TẠO APP EXPRESS ---
const app = express(); 

// Logging (Kiểm tra biến môi trường)
console.log("JWT Secret đã tải:", process.env.JWT_SECRET ? '✅ Đã tải' : '❌ Lỗi chưa tải');

// ----------------------------------------
// --- MIDDLEWARE VÀ THỨ TỰ QUAN TRỌNG ---
// ----------------------------------------

app.use(cors());

// ⭐️ QUAN TRỌNG: ĐẶT ROUTE UPLOAD FILE TRƯỚC express.json() 
// để Multer có thể xử lý multipart/form-data
app.use('/api/upload', uploadRoutes); 

// Body Parser cho các route còn lại (JSON data)
app.use(express.json());

// Cấu hình phục vụ File Tĩnh (ẢNH)
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads'))); 

// ----------------------------------------
// --- CÁC ROUTES CÒN LẠI ---
// ----------------------------------------

app.get('/', (req, res) => {
    res.json({
        message: 'AL-Shop API',
        version: '1.0.0',
        endpoints: {
            users: '/api/users',
            admin: '/api/admin', 
            products: '/api/products',
            orders: '/api/orders',
            upload: '/api/upload' 
        }
    });
});

app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes); 
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/notifications', notificationRoutes);


// ----------------------------------------
// ⭐️ HÀM KHỞI TẠO ADMIN MẶC ĐỊNH ⭐️
// ----------------------------------------
const initializeAdmin = async () => {
    const ADMIN_EMAIL = 'phuclv272@gmail.com';
    const ADMIN_PASSWORD = 'Aa@111111';

    const adminExists = await User.findOne({ email: ADMIN_EMAIL });

    if (adminExists) {
        if (adminExists.role !== 'admin') {
            adminExists.role = 'admin';
            await adminExists.save();
            console.warn(`   ⚠️ WARNING: Role của ${ADMIN_EMAIL} đã được cập nhật thành "admin".`);
        }
        console.log(`   ✅ Tài khoản Admin mặc định (${ADMIN_EMAIL}) đã tồn tại.`);
        return;
    }

    try {
        const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10); 
        
        await User.create({
            name: 'Phuc LV Admin',
            email: ADMIN_EMAIL,
            password: hashedPassword,
            role: 'admin', 
            phone: '0123456789'
        });

        console.log(`   ⭐️ ĐÃ TẠO: Tài khoản Admin mặc định (${ADMIN_EMAIL}) đã được tạo thành công.`);

    } catch (error) {
        console.error('   ❌ LỖI KHỞI TẠO ADMIN:', error.message);
    }
};
// ----------------------------------------


// --- KẾT NỐI MONGODB ---

mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('--> ✅ Đã kết nối MongoDB');
        // GỌI HÀM KHỞI TẠO ADMIN SAU KHI KẾT NỐI DB
        initializeAdmin(); 
    })
    .catch(err => console.log('❌ Lỗi kết nối MongoDB:', err));


// ----------------------------------------
// --- ERROR HANDLING CUỐI CÙNG ---
// ----------------------------------------

app.use((err, req, res, next) => {
    
    // Bắt lỗi Multer (ví dụ: File quá lớn, tên trường sai)
    if (err instanceof multer.MulterError) {
        console.error('Multer Error:', err.message);
        return res.status(400).json({ 
            success: false, 
            message: `Lỗi tải file: ${err.message}. Kiểm tra kích thước file (max 2MB) hoặc tên trường (phải là 'avatar').` 
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

const PORT = process.env.PORT || 5001; 

app.listen(PORT, () => {
    console.log(`\n--> 🚀 Server đang chạy tại http://localhost:${PORT}`);
});