// seed-admins.js

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User.model');

// Danh sách tài khoản muốn thêm
const newAdmins = [
    {
        name: "trung",
        email: "tranquangtrungedm@gmail.com",
        password: "123456789", 
        role: "admin",
        phone: "1111111111"
    },
    {
        name: "cuong",
        email: "manhcuongvcm2001@gmail.com",
        password: "123456789",
        role: "admin",
        phone: "2222222222"
    },
];

const seedAdmins = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('--> ✅ Đã kết nối MongoDB');

        for (const user of newAdmins) {
            // 1. Kiểm tra xem email đã tồn tại chưa
            const exists = await User.findOne({ email: user.email });
            
            if (exists) {
                console.log(`   - Bỏ qua: ${user.email} (Đã tồn tại)`);
            } else {
                // 2. Mã hóa mật khẩu trước khi lưu
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(user.password, salt);

                // 3. Tạo user mới
                await User.create({
                    name: user.name,
                    email: user.email,
                    password: hashedPassword, // Lưu mật khẩu đã mã hóa
                    role: user.role,
                    phone: user.phone,
                    isActive: true
                });
                
                console.log(`   + Đã tạo mới: ${user.name} (${user.email})`);
            }
        }

        console.log('--> 🎉 Hoàn tất tạo tài khoản Admin phụ!');

    } catch (error) {
        console.error('❌ Lỗi:', error);
    } finally {
        mongoose.connection.close();
        process.exit();
    }
};

seedAdmins();