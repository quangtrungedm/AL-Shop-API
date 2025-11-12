// [File] server.js (Phiên bản Hoàn Chỉnh và Sửa Lỗi Thứ Tự)

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors'); 
const path = require('path'); 
const multer = require('multer'); 

require('dotenv').config();

// Khai báo Routes
const userRoutes = require('./routes/user.routes');
const productRoutes = require('./routes/product.routes');
const orderRoutes = require('./routes/order.routes');
const uploadRoutes = require('./routes/upload.routes'); 

// --- KHỞI TẠO APP EXPRESS ---
const app = express(); 

console.log("JWT Secret đã tải:", process.env.JWT_SECRET ? '✅ Đã tải' : '❌ Lỗi chưa tải');


// --- MIDDLEWARE VÀ THỨ TỰ QUAN TRỌNG NHẤT ---

// 1. DEBUG VÀ CORS
app.use((req, res, next) => {
    if (!req.url.startsWith('/uploads')) {
        console.log(`DEBUG SERVER: REQUEST RECEIVED -> ${req.method} ${req.url}`);
    }
    next();
});
app.use(cors());


// 2. BODY PARSERS (Rất quan trọng cho API)
// Đặt Body Parser lên trên cùng để nó xử lý body JSON cho TẤT CẢ các route API
app.use(express.json()); 


// 3. CÁC ROUTES API CHÍNH (PHẢI NẰM Ở ĐÂY ĐỂ NGĂN CHẶN FALLBACK)
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes); 
app.use('/api/orders', orderRoutes);
app.use('/api/upload', uploadRoutes); 


// 4. ROUTE HOME (Root API)
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


// 5. PHỤC VỤ FILE TĨNH (Sau các route API)
// Phục vụ File Tĩnh (ẢNH)
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads'))); 


// 6. FIX LỖI 404 API FALLBACK (Trả về JSON khi API không khớp)
app.use('/api/*', (req, res) => {
    console.log(`DEBUG FALLBACK: API NOT FOUND -> ${req.path}`); 
    res.status(404).json({
        success: false,
        message: `API Endpoint không tìm thấy: ${req.path}`
    });
});


// --- KẾT NỐI MONGODB ---

mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('--> ✅ Đã kết nối MongoDB'))
    .catch(err => console.log('❌ Lỗi kết nối MongoDB:', err));


// --- ERROR HANDLING CUỐI CÙNG ---

app.use((err, req, res, next) => {
    
    if (err instanceof multer.MulterError) {
        return res.status(400).json({ 
            success: false, 
            message: `Lỗi tải file: ${err.message}. Kiểm tra kích thước file hoặc tên trường.` 
        });
    }

    if (err.message === 'Chỉ chấp nhận file ảnh (JPG, JPEG, PNG).') {
        return res.status(400).json({ 
            success: false, 
            message: err.message 
        });
    }
    
    console.error(err.stack);
    res.status(err.status || 500).json({ success: false, message: err.message || 'Lỗi Server nội bộ không xác định.' });
});


// UNIVERSAL FALLBACK (Trả về JSON khi không tìm thấy tài nguyên)
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Không tìm thấy tài nguyên cho đường dẫn: ${req.url}`
    });
});


// --- KHỞI ĐỘNG SERVER ---

const PORT = process.env.PORT || 4000; 

app.listen(PORT, () => {
    console.log(`\n--> 🚀 Server đang chạy tại http://localhost:${PORT}`);
});