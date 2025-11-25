// controllers/admin.controller.js

const User = require('../models/User.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// ⭐️ HÀM MỚI: Đăng nhập Admin ⭐️
const loginAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({ success: false, message: 'Thông tin đăng nhập không chính xác' });
        }
        
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Thông tin đăng nhập không chính xác' });
        }

        // BẮT BUỘC: KIỂM TRA VAI TRÒ ADMIN
        if (user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Bạn không có quyền truy cập quản trị.' });
        }
        
        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
            expiresIn: '30d',
        });

        const userWithoutPassword = user.toObject();
        delete userWithoutPassword.password;

        res.json({
            success: true,
            token,
            data: userWithoutPassword
        });
    } catch (error) {
        console.error("ERROR: Admin Login failed:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};


// Lấy danh sách users (Admin Function)
const getUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json({ success: true, data: users });
    } catch (error) {
        console.error("ERROR: Admin getUsers failed:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Lấy thông tin 1 user (Admin Function)
const getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy user' });
        }
        res.json({ success: true, data: user });
    } catch (error) {
        console.error("ERROR: Admin getUserById failed:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// CẬP NHẬT HÀM updateUser (Admin Function)
const updateUser = async (req, res) => {
    try {
        const userId = req.params.id;
        // Admin có thể cập nhật mọi thông tin, bao gồm cả Role
        const { name, email, phone, address, avatar, role } = req.body; 

        if (!name || !email) {
            return res.status(400).json({ success: false, message: 'Tên và Email không được để trống.' });
        }
        
        // Kiểm tra xem Admin có đang cố gắng hạ cấp tài khoản của chính mình không (Tùy chọn)
        if (req.user && req.user._id.toString() === userId && role === 'user') {
             return res.status(403).json({ success: false, message: 'Không thể hạ cấp tài khoản Admin đang hoạt động.' });
        }


        const updates = {};
        if (name) updates.name = name;
        if (email) updates.email = email;
        updates.phone = phone !== undefined ? phone : '';
        updates.address = address !== undefined ? address : '';
        updates.avatar = avatar !== undefined ? avatar : '';
        if (role) updates.role = role; // Cho phép Admin chỉnh sửa role

        const user = await User.findByIdAndUpdate(
            userId,
            { $set: updates },
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng để cập nhật.' });
        }

        res.status(200).json({
            success: true,
            message: 'Cập nhật thông tin người dùng thành công.',
            data: user
        });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'Email này đã được sử dụng bởi người khác.' });
        }
        console.error("ERROR: Admin updateUser failed:", error);
        res.status(400).json({ success: false, message: error.message });
    }
};

// Xóa user (Admin Function)
const deleteUser = async (req, res) => {
    try {
        const userId = req.params.id;
        
        // Kiểm tra xem Admin có tự xóa mình không
        if (req.user && req.user._id.toString() === userId) {
             return res.status(403).json({ success: false, message: 'Admin không được tự xóa tài khoản của mình.' });
        }

        await User.findByIdAndDelete(userId);
        res.json({ success: true, message: 'Đã xóa user' });
    } catch (error) {
        console.error("ERROR: Admin deleteUser failed:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};


module.exports = {
    loginAdmin,
    getUsers,
    getUserById,
    updateUser,
    deleteUser,
};