// [File] server.js

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors'); 
const path = require('path'); 
const multer = require('multer'); 
const bcrypt = require('bcrypt');
require('dotenv').config();

// Import Models
const User = require('./models/User.model');

// --- KHAI BÁO ROUTES ---
const userRoutes = require('./routes/user.routes');
const adminRoutes = require('./routes/admin.route'); 
const productRoutes = require('./routes/product.routes');
const orderRoutes = require('./routes/order.routes');
const uploadRoutes = require('./routes/upload.routes');
const addressRoutes = require('./routes/address.routes');
const notificationRoutes = require('./routes/notification.routes');
const reviewRoutes = require('./routes/review.routes');

// ✅ SỬA LỖI 1: Gọi đúng tên file 'category.route.js' bạn đang có
const categoriesRoutes = require('./routes/category.route'); 

// --- KHỞI TẠO APP EXPRESS ---
const app = express(); 

// Logging (Kiểm tra biến môi trường)
console.log("JWT Secret đã tải:", process.env.JWT_SECRET ? '✅ Đã tải' : '❌ Lỗi chưa tải');

// ----------------------------------------
// --- MIDDLEWARE ---
// ----------------------------------------

app.use(cors());

// Route Upload file (Đặt trước express.json)
app.use('/api/upload', uploadRoutes); 

// Body Parser
app.use(express.json());

// Cấu hình phục vụ File Tĩnh (Ảnh)
// Cấu hình cả 2 đường dẫn để đảm bảo frontend gọi kiểu nào cũng được
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads'))); 
app.use('/public/uploads', express.static(path.join(__dirname, 'public/uploads')));

// ----------------------------------------
// --- CÁC ROUTES API ---
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
            upload: '/api/upload',
            categories: '/api/categories'
        }
    });
});

app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes); 
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/notifications', require('./routes/notification.routes'));
app.use('/api/reviews', reviewRoutes);
app.use('/api/reviews', require('./routes/review.routes'));
app.use('/public', express.static(path.join(__dirname, 'public')));
// ✅ SỬA LỖI 2: Dùng '/api/categories' trực tiếp cho đồng bộ
app.use('/api/categories', categoriesRoutes);


// ----------------------------------------
// ⭐️ HÀM KHỞI TẠO & CẬP NHẬT ADMIN MẶC ĐỊNH ⭐️
// ----------------------------------------
const initializeAdmin = async () => {
    const ADMIN_EMAIL = 'phuclv272@gmail.com';
    const ADMIN_PASSWORD = 'Aa@111111'; // Mật khẩu bạn đang dùng

    let adminUser = await User.findOne({ email: ADMIN_EMAIL });

    if (!adminUser) {
        // --- TẠO MỚI ---
        try {
            await User.create({
                name: 'Phuc LV Admin',
                email: ADMIN_EMAIL,
                password: ADMIN_PASSWORD, 
                role: 'admin', 
                phone: '0123456789'
            });
            console.log(`   ⭐️ ĐÃ TẠO: Tài khoản Admin mặc định (${ADMIN_EMAIL}) thành công.`);
        } catch (error) {
            console.error('   ❌ LỖI KHỞI TẠO ADMIN:', error.message);
        }
    } else {
        // --- CẬP NHẬT (Dev/Test) ---
        let needsSave = false;
        
        // Kiểm tra Role
        if (adminUser.role !== 'admin') {
            adminUser.role = 'admin';
            needsSave = true;
            console.warn(`   ⚠️ WARNING: Role của ${ADMIN_EMAIL} đã được cập nhật thành "admin".`);
        }
        
        // Kiểm tra Mật khẩu
        try {
            const isPasswordMatch = await bcrypt.compare(ADMIN_PASSWORD, adminUser.password);
            
            if (!isPasswordMatch) {
                adminUser.password = ADMIN_PASSWORD; 
                needsSave = true;
                console.log(`   ⚠️ WARNING: Mật khẩu Admin đã được CẬP NHẬT lại khớp với mặc định.`);
            }
        } catch (compareError) {
            console.error('   ❌ LỖI SO SÁNH MẬT KHẨU CŨ, KHỞI TẠO LẠI HASH');
            adminUser.password = ADMIN_PASSWORD;
            needsSave = true;
        }

        if (needsSave) {
            await adminUser.save();
        }
        console.log(`   ✅ Tài khoản Admin mặc định (${ADMIN_EMAIL}) đã sẵn sàng.`);
    }
};

// ----------------------------------------
// --- KẾT NỐI MONGODB & CHẠY SERVER ---
// ----------------------------------------

mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('--> ✅ Đã kết nối MongoDB');
        initializeAdmin(); 
    })
    .catch(err => console.log('❌ Lỗi kết nối MongoDB:', err));

// Xử lý lỗi (Error Handling)
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        return res.status(400).json({ 
            success: false, 
            message: `Lỗi tải file: ${err.message}.` 
        });
    }

    if (err.message === 'Chỉ chấp nhận file ảnh (JPG, JPEG, PNG).') {
        return res.status(400).json({ success: false, message: err.message });
    }
    
    console.error(err.stack);
    res.status(err.status || 500).json({ success: false, message: err.message || 'Lỗi Server nội bộ.' });
});

const PORT = process.env.PORT || 5001; 

app.listen(PORT, () => {
    console.log(`\n--> 🚀 Server đang chạy tại http://localhost:${PORT}`);
});