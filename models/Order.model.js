// File: models/Order.model.js

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
    // 👇 Trường lưu tổng tiền tên là 'total'
    total: { type: Number, required: true }, 
    
    // ⭐ Đã chuyển sang Embedded Object cho địa chỉ
    shippingAddress: { 
        type: {
            recipientName: { type: String, required: true },
            fullAddress: { type: String, required: true },
            phoneNumber: { type: String, required: true }
        }, 
        required: true 
    }, 
    
    status: { 
        type: String, 
        enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'], 
        default: 'pending' 
    },
    orderDate: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);