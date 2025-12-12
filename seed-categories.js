// seed-categories.js

require('dotenv').config(); // Load biến môi trường để lấy MONGODB_URI
const mongoose = require('mongoose');
const Category = require('./models/Category.model'); // Đảm bảo đường dẫn đúng tới Model

// Danh sách 12 danh mục thời trang phổ biến
const fashionCategories = [
    { name: "Áo Nam (Men's Tops)", isActive: true },
    { name: "Quần Nam (Men's Bottoms)", isActive: true },
    { name: "Áo Nữ (Women's Tops)", isActive: true },
    { name: "Quần Nữ (Women's Bottoms)", isActive: true },
    { name: "Váy & Đầm (Dresses)", isActive: true },
    { name: "Áo Khoác (Outerwear)", isActive: true },
    { name: "Đồ Thể Thao (Activewear)", isActive: true },
    { name: "Đồ Ngủ & Nội Y (Lingerie)", isActive: true },
    { name: "Giày Dép (Footwear)", isActive: true },
    { name: "Túi Xách (Bags)", isActive: true },
    { name: "Phụ Kiện (Accessories)", isActive: true },
    { name: "Thời Trang Trẻ Em (Kids)", isActive: true }
];

const seedData = async () => {
    try {
        // 1. Kết nối DB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('--> ✅ Đã kết nối MongoDB để Seed data');

        // 2. Chạy vòng lặp để thêm từng cái
        for (const cat of fashionCategories) {
            // Kiểm tra xem tên đã tồn tại chưa để tránh lỗi trùng lặp
            const exists = await Category.findOne({ name: cat.name });
            
            if (!exists) {
                await Category.create(cat);
                console.log(`   + Đã thêm: ${cat.name}`);
            } else {
                console.log(`   - Bỏ qua (Đã tồn tại): ${cat.name}`);
            }
        }

        console.log('--> 🎉 Hoàn tất thêm danh mục!');
    } catch (error) {
        console.error('❌ Lỗi:', error);
    } finally {
        // 3. Ngắt kết nối và thoát
        mongoose.connection.close();
        process.exit();
    }
};

// Chạy hàm
seedData();