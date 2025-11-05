const mongoose = require('mongoose');

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

    // --- THÔNG TIN LIÊN HỆ & ĐỊA CHỈ (Đã có) ---
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

module.exports = mongoose.model('User', userSchema);