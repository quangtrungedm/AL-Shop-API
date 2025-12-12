const User = require('../models/User.model');
const Product = require('../models/Product.model');
const PasswordReset = require('../models/PasswordReset.model');
const Address = require('../models/Address.model');
const bcrypt = require('bcryptjs'); 
const jwt = require('jsonwebtoken');
const { sendEmail } = require('../helpers/send-email'); 

// --- 1. XÁC THỰC (AUTH) ---

const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ thông tin.' });
        }
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Email đã tồn tại.' });
        }
        
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await User.create({ 
            name, 
            email, 
            password: hashedPassword 
        }); 
        
        res.status(201).json({
            success: true,
            message: 'Đăng ký thành công.',
            data: { id: user._id, name: user.name, email: user.email }
        });
    } catch (error) {
        console.error("ERROR: Register failed:", error);
        res.status(400).json({ success: false, message: error.message });
    }
};

const login = async (req, res) => {
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
        console.error("ERROR: Login failed:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// --- 2. QUÊN MẬT KHẨU & OTP ---

const forgotPassword = async (req, res) => { 
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Vui lòng nhập email.' });

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(200).json({ success: true, message: 'Nếu email tồn tại, OTP đã được gửi đi.' });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = Date.now() + 5 * 60000; // 5 phút
        
        await PasswordReset.findOneAndUpdate(
            { email },
            { otp: otp, expiresAt: expiresAt, verified: false },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        
        const emailContent = `
            <h1>Mã xác nhận Đặt lại mật khẩu AL-Shop</h1>
            <p>Mã OTP của bạn là: <strong>${otp}</strong></p>
            <p>Mã này sẽ hết hạn trong 5 phút.</p>
        `;

        const emailSent = await sendEmail({
            to: email,
            subject: 'Mã OTP Đặt lại mật khẩu AL-Shop',
            htmlContent: emailContent,
        }); 

        if (emailSent) {
            return res.status(200).json({ success: true, message: 'Mã OTP đã được gửi đến email của bạn.' });
        } else {
            return res.status(500).json({ success: false, message: 'Lỗi dịch vụ gửi mail.' });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: 'Lỗi server khi gửi OTP.' });
    }
};

const verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) return res.status(400).json({ success: false, message: 'Thiếu thông tin.' });

        const now = Date.now();
        const reset = await PasswordReset.findOne({ email, otp });
        
        if (!reset) return res.status(400).json({ success: false, message: 'Mã xác thực không hợp lệ.' });
        if (reset.expiresAt < now) return res.status(400).json({ success: false, message: 'OTP đã hết hạn.' });
        if (reset.verified) return res.status(400).json({ success: false, message: 'OTP đã được xác minh.' });

        reset.verified = true;
        await reset.save();

        res.json({ success: true, message: 'Xác thực OTP thành công.' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Lỗi server.' });
    }
};

const setNewPassword = async (req, res) => {
    try {
        const { email, newPassword } = req.body; 
        if (!email || !newPassword) return res.status(400).json({ success: false, message: 'Thiếu thông tin.' });

        const reset = await PasswordReset.findOne({ email, verified: true });
        if (!reset) return res.status(400).json({ success: false, message: 'Yêu cầu không hợp lệ.' });

        if (reset.expiresAt < Date.now()) {
            await PasswordReset.deleteMany({ email });
            return res.status(400).json({ success: false, message: 'Phiên hết hạn.' });
        }
        
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();
        
        await PasswordReset.deleteMany({ email });

        res.json({ success: true, message: 'Đổi mật khẩu thành công.' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Lỗi server.' });
    }
};

// --- 3. QUẢN LÝ USER & UPLOAD ---

const getUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: users });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ⭐️ CẬP NHẬT THÔNG TIN USER (ĐÃ THÊM DEBUG) ⭐️
const updateUser = async (req, res) => {
    try {
        const userId = req.params.id; // ID từ URL
        const requestingUser = req.user; // User từ Token
        const { name, phone, address, avatar } = req.body;

        // --- 🔍 DEBUG LOG START ---
        console.log("\n--- [DEBUG] UPDATE USER START ---");
        console.log("1. Target ID (from URL):", userId, `(Type: ${typeof userId})`);
        console.log("2. Requester ID (from Token):", requestingUser._id, `(Type: ${typeof requestingUser._id})`);
        console.log("3. Requester Role:", requestingUser.role);
        console.log("4. Body Data:", { name, phone, address, avatar });
        
        // So sánh trực tiếp xem tại sao lỗi
        const isIdMatch = requestingUser._id.toString() === userId;
        console.log(`5. Check ID Match: ${requestingUser._id} == ${userId} ? -> ${isIdMatch}`);
        // --- 🔍 DEBUG LOG END ---

        // ⭐️ FIX LỖI 403: Dùng .toString() để so sánh an toàn
        if (requestingUser.role !== 'admin' && requestingUser._id.toString() !== userId) {
            console.log("❌ [DEBUG] Update Denied: Forbidden");
            return res.status(403).json({ success: false, message: 'Forbidden: Bạn không có quyền sửa tài khoản này.' });
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId, 
            { name, phone, address, avatar }, 
            { new: true } 
        ).select('-password');

        if (!updatedUser) {
            console.log("❌ [DEBUG] User not found in DB");
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        
        console.log("✅ [DEBUG] Update Success!");
        res.status(200).json({ success: true, message: 'Update success', data: updatedUser });

    } catch (error) {
        console.error("❌ [DEBUG] Update User Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ⭐️ UPLOAD AVATAR (ĐÃ FIX PATH) ⭐️
const uploadAvatar = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded.' });
        }

        const relativePath = `/public/uploads/avatars/${req.file.filename}`;
        
        // Cập nhật ngay vào DB để đảm bảo đồng bộ
        const userId = req.user._id;
        await User.findByIdAndUpdate(userId, { avatar: relativePath });

        res.status(200).json({ 
            success: true, 
            message: 'Avatar uploaded successfully',
            url: relativePath 
        });
    } catch (error) {
        console.error("Upload Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// --- 4. CÁC HÀM KHÁC ---

const updateUserProfile = async (req, res) => {
    return updateUser(req, res);
};

const updateUserSettings = async (req, res) => {
    try {
        const { settings } = req.body; 
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { $set: { settings: settings } }, 
            { new: true }
        ).select('-password');
        res.json({ success: true, data: user, message: 'Settings saved' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

const deleteUser = async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, message: 'User deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getUserAnalytics = async (req, res) => {
    try {
        const { type } = req.query;
        let startDate = new Date();
        startDate.setMonth(0, 1); 
        
        const stats = await User.aggregate([
            { $match: { createdAt: { $gte: startDate } } },
            { $group: { _id: { $month: "$createdAt" }, totalUsers: { $sum: 1 } } },
            { $sort: { _id: 1 } }
        ]);
        res.status(200).json({ success: true, data: stats });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const toggleFavorite = async (req, res) => {
    try {
        const userId = req.user?._id; 
        const { productId } = req.body;
        if (!userId) return res.status(401).json({ success: false, message: 'Auth failed' });

        const user = await User.findById(userId);
        if (user.favorites.includes(productId)) {
            await User.findByIdAndUpdate(userId, { $pull: { favorites: productId } });
            return res.status(200).json({ success: true, message: 'Removed from favorites' });
        } else {
            await User.findByIdAndUpdate(userId, { $addToSet: { favorites: productId } });
            return res.status(200).json({ success: true, message: 'Added to favorites' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

const getFavorites = async (req, res) => {
    try {
        const userId = req.user?._id; 
        const user = await User.findById(userId).populate('favorites');
        res.status(200).json({ success: true, data: user.favorites });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

const getCheckoutInfo = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId).select('name phone email');
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        
        let addressToUse = await Address.findOne({ user: userId, isDefault: true });
        if (!addressToUse) {
            addressToUse = await Address.findOne({ user: userId }).sort({ createdAt: -1 });
        }

        res.json({
            success: true,
            data: {
                recipientName: addressToUse ? addressToUse.recipientName : user.name,
                phoneNumber: addressToUse ? addressToUse.phoneNumber : user.phone,
                address: addressToUse ? addressToUse.fullAddress : '',
                email: user.email
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    register,
    login, 
    forgotPassword,
    verifyOtp,
    setNewPassword,
    getUsers,
    updateUser, 
    updateUserProfile,
    updateUserSettings,
    uploadAvatar,
    deleteUser,
    getUserAnalytics,
    toggleFavorite,
    getFavorites,
    getCheckoutInfo
};