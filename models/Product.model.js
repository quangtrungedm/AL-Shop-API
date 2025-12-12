const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true,
    },
    description: {
        type: String,
        required: true
    },
    price: { 
        type: Number, 
        default: 0 
    },
    // --- PHẦN ĐÃ SỬA ---
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category', // Phải khớp tên với model Category ở trên
        required: true
    },
    // -------------------
    image: [String], 
    stock: { 
        type: Number, 
        required: true,
        min: 0,
        default: 0
    },
    isActive: { 
        type: Boolean, 
        default: true 
    } 
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);