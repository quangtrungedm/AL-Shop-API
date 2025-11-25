// models/User.model.js

const mongoose = require('mongoose');
const bcrypt = require('bcrypt'); // Đã import bcrypt

const userSchema = new mongoose.Schema({
    // --- THÔNG TIN CƠ BẢN ---
    name: { 
        type: String, 
        required: true, 
        trim: true 
    },
    email: { 
        type: String, 
        required: true, 
        unique: true, 
        trim: true 
    },
    password: { 
        type: String, 
        required: true 
    },
    
    // ⭐️ BỔ SUNG: TRƯỜNG AVATAR
    avatar: {
        type: String,
        trim: true,
        default: 'https://i.pravatar.cc/150', // URL ảnh mặc định
    },

    // --- THÔNG TIN LIÊN HỆ & ĐỊA CHỈ ---
    phone: { 
        type: String, 
        trim: true,
    },
    address: {
        type: String, 
        trim: true,
        default: '',
    },

    // --- TRƯỜNG BẢO VỆ & VAI TRÒ ---
    role: { 
        type: String, 
        enum: ['user', 'admin'], 
        default: 'user' 
    },
    
    // Trường bảo vệ
    favorites: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product' 
        }
    ]
}, { timestamps: true });

// ⭐️ Middleware: Mã hóa mật khẩu trước khi lưu (Chỉ khi password thay đổi) ⭐️
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

module.exports = mongoose.model('User', userSchema);