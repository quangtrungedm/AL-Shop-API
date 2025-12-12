const mongoose = require('mongoose');

const categorySchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    // --- THÊM DÒNG NÀY ---
    isActive: { 
        type: Boolean, 
        default: true // Mặc định tạo mới là Hiện
    }, 
    // ---------------------
}, { timestamps: true });

module.exports = mongoose.model('Category', categorySchema);