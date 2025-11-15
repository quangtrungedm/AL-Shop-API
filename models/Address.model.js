// models/Address.model.js

const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
    // Đảm bảo các trường được định nghĩa đúng
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    recipientName: {
        type: String,
        required: true,
        trim: true,
    },
    fullAddress: {
        type: String,
        required: true,
    },
    phoneNumber: {
        type: String,
        required: true,
        match: [/^\d{10,11}$/, 'Vui lòng nhập số điện thoại hợp lệ (10-11 chữ số)'],
    },
    isDefault: {
        type: Boolean,
        default: false,
    }
}, { timestamps: true });

// Đảm bảo middleware là hợp lệ
addressSchema.pre('save', async function (next) {
    if (this.isDefault) {
        // Cần đảm bảo this.model('Address') là chính xác
        await this.model('Address').updateMany(
            { user: this.user, _id: { $ne: this._id } },
            { isDefault: false }
        );
    }
    next();
});

module.exports = mongoose.model('Address', addressSchema);