const Address = require('../models/Address.model');
const mongoose = require('mongoose');

// Hàm 1: Lấy danh sách tất cả địa chỉ của người dùng hiện tại
const getAddresses = async (req, res) => {
    // Giả định User ID được lấy từ token (req.user.id)
    const userId = req.user.id; 

    try {
        const addresses = await Address.find({ user: userId }).sort({ isDefault: -1, createdAt: 1 });
        res.json({ success: true, data: addresses });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Hàm 2: Thêm địa chỉ mới
const createAddress = async (req, res) => {
    const userId = req.user.id; 

    try {
        const { recipientName, fullAddress, phoneNumber, isDefault } = req.body;
        
        // Tạo địa chỉ mới
        const newAddress = new Address({
            user: userId,
            recipientName,
            fullAddress,
            phoneNumber,
            isDefault: isDefault || false
        });

        // Nếu đây là địa chỉ đầu tiên của user, đặt nó làm mặc định
        const addressCount = await Address.countDocuments({ user: userId });
        if (addressCount === 0) {
            newAddress.isDefault = true;
        }

        // Middleware pre('save') sẽ xử lý việc reset isDefault của các địa chỉ khác
        await newAddress.save();

        res.status(201).json({ success: true, message: 'Địa chỉ đã được thêm thành công.', data: newAddress });
    } catch (error) {
        // Lỗi validation Mongoose (400) hoặc lỗi server (500)
        res.status(400).json({ success: false, message: error.message });
    }
};

// Hàm 3: Cập nhật địa chỉ (Tên, Địa chỉ, Số điện thoại, Mặc định)
const updateAddress = async (req, res) => {
    const userId = req.user.id;
    const addressId = req.params.id;

    try {
        const updatedAddress = await Address.findOneAndUpdate(
            { _id: addressId, user: userId }, // Đảm bảo chỉ user sở hữu mới được sửa
            req.body,
            { new: true, runValidators: true }
        );

        if (!updatedAddress) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy địa chỉ này.' });
        }
        
        // Nếu isDefault là true, trigger middleware để reset các địa chỉ khác.
        if (req.body.isDefault === true) {
            await Address.updateMany(
                { user: userId, _id: { $ne: addressId } },
                { isDefault: false }
            );
        }

        res.json({ success: true, message: 'Địa chỉ đã được cập nhật.', data: updatedAddress });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// Hàm 4: Xóa địa chỉ
const deleteAddress = async (req, res) => {
    const userId = req.user.id;
    const addressId = req.params.id;

    try {
        const deletedAddress = await Address.findOneAndDelete({ _id: addressId, user: userId });

        if (!deletedAddress) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy địa chỉ này.' });
        }
        
        // NẾU địa chỉ bị xóa là mặc định, CẦN chọn địa chỉ khác làm mặc định.
        if (deletedAddress.isDefault) {
            const nextDefault = await Address.findOne({ user: userId });
            if (nextDefault) {
                nextDefault.isDefault = true;
                await nextDefault.save();
            }
        }

        res.json({ success: true, message: 'Địa chỉ đã được xóa thành công.' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ⭐️ EXPORT TẤT CẢ CÁC HÀM CÙNG LÚC ⭐️
module.exports = {
    getAddresses,
    createAddress,
    updateAddress,
    deleteAddress,
};