// File: models/Order.model.js (FIXED)

const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    products: [{
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        quantity: Number,
        price: Number
    }],
    total: { type: Number, required: true },
    
    // ⭐ FIX 1: Thay đổi từ ObjectId/ref sang Embedded Object ⭐
    shippingAddress: { 
        type: {
            recipientName: { type: String, required: true },
            fullAddress: { type: String, required: true },
            phoneNumber: { type: String, required: true }
        }, 
        required: true // Bắt buộc phải có đối tượng địa chỉ
    }, 
    
    status: { 
        type: String, 
        enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'], 
        default: 'pending' 
    },
    orderDate: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);