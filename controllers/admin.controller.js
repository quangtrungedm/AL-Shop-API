// controllers/admin.controller.js

const User = require('../models/User.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// ⭐️ HÀM MỚI: Đăng nhập Admin ⭐️
// ⭐️ HÀM MỚI: Đăng nhập Admin ⭐️
const loginAdmin = async (req, res) => {
    // ⭐️ DEBUG 1: Nhận dữ liệu đầu vào ⭐️
    console.log('====================================================');
    console.log('🚀 [SERVER DEBUG] BẮT ĐẦU Admin Login...');
    try {
        const { email, password } = req.body;
        console.log(`[SERVER DEBUG] Input: Email=${email}`);

        // 1. Tìm User
        const user = await User.findOne({ email });

        // ⭐️ DEBUG 2: Kiểm tra User tồn tại ⭐️
        if (!user) {
            console.log(`❌ [SERVER DEBUG] LỖI 1: KHÔNG tìm thấy User với email: ${email}`);
            return res.status(401).json({ success: false, message: 'Invalid login credentials.' });
        }

        console.log(`✅ [SERVER DEBUG] Đã tìm thấy User (ID: ${user._id}). Role DB: ${user.role}`);

        // 2. So sánh Mật khẩu (NGUYÊN NHÂN THƯỜNG GẶP NHẤT)
        const isMatch = await bcrypt.compare(password, user.password);

        // ⭐️ DEBUG 3: Kết quả so sánh mật khẩu ⭐️
        console.log(`🔑 [SERVER DEBUG] Mật khẩu nhập vào có khớp không (isMatch): ${isMatch}`);

        if (!isMatch) {
            console.log('❌ [SERVER DEBUG] LỖI 2: Mật khẩu không khớp.');
            return res.status(401).json({ success: false, message: 'Invalid login credentials.' });
        }

        // 3. KIỂM TRA VAI TRÒ ADMIN
        if (user.role !== 'admin') {
            console.log(`❌ [SERVER DEBUG] LỖI 3: Tài khoản không có vai trò Admin. Role hiện tại: ${user.role}`);
            return res.status(403).json({ success: false, message: 'You do not have administrative access.' });
        }

        // Thành công
        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
            expiresIn: '30d',
        });

        const userWithoutPassword = user.toObject();
        delete userWithoutPassword.password;

        console.log('🎉 [SERVER DEBUG] Đăng nhập Admin thành công!');
        console.log('====================================================');

        res.json({
            success: true,
            token,
            data: userWithoutPassword
        });
    } catch (error) {
        console.error("❌ [SERVER DEBUG] LỖI SERVER 500: Admin Login failed:", error);
        console.log('====================================================');
        // Trả về lỗi server nội bộ (chú ý không để lộ chi tiết lỗi ra ngoài)
        res.status(500).json({ success: false, message: 'Internal server error. Please check console.' });
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
            return res.status(404).json({ success: false, message: 'User not found' });
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
            return res.status(400).json({ success: false, message: 'Name and Email cannot be empty.' });
        }

        // Kiểm tra xem Admin có đang cố gắng hạ cấp tài khoản của chính mình không (Tùy chọn)
        if (req.user && req.user._id.toString() === userId && role === 'user') {
            return res.status(403).json({ success: false, message: 'Cannot downgrade active Admin account.' });
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
            return res.status(404).json({ success: false, message: 'User to update not found.' });
        }

        res.status(200).json({
            success: true,
            message: 'User information updated successfully.',
            data: user
        });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'This email is already used by another user.' });
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
            return res.status(403).json({ success: false, message: 'Admin cannot delete their own account.' });
        }

        await User.findByIdAndDelete(userId);
        res.json({ success: true, message: 'User deleted' });
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