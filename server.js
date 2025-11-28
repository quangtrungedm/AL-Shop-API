// [File] server.js

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

// QUAN TRỌNG: ĐẶT ROUTE UPLOAD FILE TRƯỚC express.json() 
app.use('/api/upload', uploadRoutes); 

// Body Parser cho các route còn lại (JSON data)
app.use(express.json());

// Cấu hình phục vụ File Tĩnh (ẢNH)
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads'))); 

// ----------------------------------------
// --- CÁC ROUTES CÒN LẠI ---
// ----------------------------------------
app.use('/public/uploads', express.static(path.join(__dirname, 'public/uploads')));

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
// ⭐️ HÀM KHỞI TẠO & CẬP NHẬT ADMIN MẶC ĐỊNH ⭐️
// ----------------------------------------
const initializeAdmin = async () => {
    const ADMIN_EMAIL = 'phuclv272@gmail.com';
    const ADMIN_PASSWORD = 'Aa@111111'; // Mật khẩu bạn đang dùng trên Client

    let adminUser = await User.findOne({ email: ADMIN_EMAIL });

    if (!adminUser) {
        // --- TẠO MỚI ---
        try {
            // NOTE: Middleware pre('save') sẽ tự hash password này.
            await User.create({
                name: 'Phuc LV Admin',
                email: ADMIN_EMAIL,
                password: ADMIN_PASSWORD, // Gán plaintext, để middleware model hash.
                role: 'admin', 
                phone: '0123456789'
            });

            console.log(`   ⭐️ ĐÃ TẠO: Tài khoản Admin mặc định (${ADMIN_EMAIL}) đã được tạo thành công.`);

        } catch (error) {
            console.error('   ❌ LỖI KHỞI TẠO ADMIN:', error.message);
        }
    } else {
        // --- CẬP NHẬT (Dev/Test) ---
        let needsSave = false;
        
        // Kiểm tra Role
        if (adminUser.role !== 'admin') {
            adminUser.role = 'admin';
            needsSave = true;
            console.warn(`   ⚠️ WARNING: Role của ${ADMIN_EMAIL} đã được cập nhật thành "admin".`);
        }
        
        // Kiểm tra Mật khẩu
        try {
            const isPasswordMatch = await bcrypt.compare(ADMIN_PASSWORD, adminUser.password);
            
            if (!isPasswordMatch) {
                // ⭐️ SỬA LỖI HASH KÉP: Gán mật khẩu PLAIN-TEXT 
                // Middleware pre('save') sẽ hash nó khi save().
                adminUser.password = ADMIN_PASSWORD; 
                needsSave = true;
                console.log(`   ⚠️ WARNING: Mật khẩu Admin đã được CẬP NHẬT lại khớp với mật khẩu mặc định.`);
            }
        } catch (compareError) {
            // Xử lý trường hợp hash cũ bị lỗi
            console.error('   ❌ LỖI SO SÁNH MẬT KHẨU CŨ, KHỞI TẠO LẠI HASH');
            adminUser.password = ADMIN_PASSWORD; // Gán plaintext để hash lại
            needsSave = true;
        }

        if (needsSave) {
            await adminUser.save();
        }
        console.log(`   ✅ Tài khoản Admin mặc định (${ADMIN_EMAIL}) đã tồn tại và được kiểm tra.`);
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
    
    // Bắt lỗi Multer 
    if (err instanceof multer.MulterError) {
        console.error('Multer Error:', err.message);
        return res.status(400).json({ 
            success: false, 
            message: `Lỗi tải file: ${err.message}. Kiểm tra kích thước file (max 2MB) hoặc tên trường (phải là 'avatar').` 
        });
    }

    // Bắt lỗi từ fileFilter 
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