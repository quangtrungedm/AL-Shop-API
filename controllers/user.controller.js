const User = require('../models/User.model');
const Product = require('../models/Product.model');
const bcrypt = require('bcryptjs'); // Lưu ý: dùng bcryptjs nếu bạn cài package này, hoặc bcrypt
const jwt = require('jsonwebtoken');
const PasswordReset = require('../models/PasswordReset.model');
const { sendEmail } = require('../helpers/send-email'); 

// --- HÀM XÁC THỰC VÀ ĐĂNG NHẬP ---
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
        
        // Hash password trước khi lưu
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await User.create({ 
            name, 
            email, 
            password: hashedPassword // Lưu password đã mã hóa
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

const forgotPassword = async (req, res) => { 
    const { email } = req.body;
    
    if (!email) {
        return res.status(400).json({ success: false, message: 'Vui lòng nhập email.' });
    }

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(200).json({ 
                success: true, 
                message: 'Nếu email tồn tại, OTP đã được gửi đi.' 
            });
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
            <p>Mã này sẽ hết hạn trong 5 phút. Vui lòng không chia sẻ.</p>
        `;

        const emailSent = await sendEmail({
            to: email,
            subject: 'Mã OTP Đặt lại mật khẩu AL-Shop',
            htmlContent: emailContent,
        }); 

        if (emailSent) {
            return res.status(200).json({ 
                success: true, 
                message: 'Mã OTP đã được gửi đến email của bạn.' 
            });
        } else {
            return res.status(500).json({ 
                success: false, 
                message: 'Lỗi dịch vụ gửi mail. Vui lòng thử lại sau.' 
            });
        }
    } catch (err) {
        console.error("ERROR: forgotPassword failed:", err);
        res.status(500).json({ success: false, message: 'Có lỗi server khi gửi OTP.' });
    }
};

const verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) return res.status(400).json({ success: false, message: 'Vui lòng nhập đầy đủ email và OTP.' });

        const now = Date.now();
        const reset = await PasswordReset.findOne({ email, otp });
        
        if (!reset) {
            return res.status(400).json({ success: false, message: 'Mã xác thực không hợp lệ.' });
        }
        
        if (reset.expiresAt < now) {
            await PasswordReset.deleteMany({ email });
            return res.status(400).json({ success: false, message: 'OTP đã hết hạn. Vui lòng yêu cầu OTP mới.' });
        }
        
        if (reset.verified) {
            return res.status(400).json({ success: false, message: 'OTP đã được xác minh trước đó.' });
        }

        reset.verified = true;
        await reset.save();

        res.json({ success: true, message: 'Xác thực OTP thành công. Bạn có thể đặt lại mật khẩu.' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Lỗi server khi xác thực OTP.' });
    }
};

const setNewPassword = async (req, res) => {
    try {
        const { email, newPassword } = req.body; 
        
        if (!email || !newPassword) {
            return res.status(400).json({ success: false, message: 'Please provide both email and new password.' });
        }

        const reset = await PasswordReset.findOne({ email, verified: true });
        
        if (!reset) {
            return res.status(400).json({ success: false, message: 'Invalid or unverified password reset session.' });
        }

        const now = Date.now();
        if (reset.expiresAt < now) {
            await PasswordReset.deleteMany({ email });
            return res.status(400).json({ success: false, message: 'Session expired.' });
        }
        
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User account not found.' });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt); // Hash password mới
        await user.save();
        
        await PasswordReset.deleteMany({ email });

        res.json({ success: true, message: 'Password changed successfully.' });

    } catch (err) {
        res.status(500).json({ success: false, message: 'Internal server error while updating password.' });
    }
};

// --- HÀM QUẢN LÝ USER ---

const getUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: users });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getUserAnalytics = async (req, res) => {
    try {
        const { type } = req.query;
        const today = new Date();
        let startDate = new Date();
        let groupBy = {};

        switch (type) {
            case 'day':
                startDate.setHours(0, 0, 0, 0);
                groupBy = { $hour: "$createdAt" };
                break;
            case 'week':
                startDate.setDate(today.getDate() - 6);
                startDate.setHours(0, 0, 0, 0);
                groupBy = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };
                break;
            case 'month':
                startDate.setDate(1);
                startDate.setHours(0, 0, 0, 0);
                groupBy = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };
                break;
            case 'year':
            default:
                startDate.setMonth(0, 1);
                startDate.setHours(0, 0, 0, 0);
                groupBy = { $month: "$createdAt" };
        }

        const stats = await User.aggregate([
            { $match: { createdAt: { $gte: startDate } } },
            { $group: { _id: groupBy, totalUsers: { $sum: 1 } } },
            { $sort: { _id: 1 } }
        ]);

        res.status(200).json({ success: true, data: stats });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Cập nhật thông tin User (General Info)
const updateUser = async (req, res) => {
    try {
        const userId = req.params.id;
        const requestingUser = req.user;
        const updateFields = req.body;
        
        if (requestingUser.role !== 'admin' && requestingUser.id !== userId) {
            return res.status(403).json({ success: false, message: 'Forbidden' });
        }

        delete updateFields.role;
        delete updateFields.password;
        delete updateFields.favorites;

        const updatedUser = await User.findByIdAndUpdate(userId, updateFields, { new: true }).select('-password');

        if (!updatedUser) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        
        res.status(200).json({ success: true, message: 'Update success', data: updatedUser });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Cập nhật thông tin User Profile (Riêng biệt)
const updateUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        user.name = req.body.name || user.name;
        user.phone = req.body.phone || user.phone;
        
        if (req.body.password) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(req.body.password, salt);
        }

        await user.save();
        
        const userResponse = user.toObject();
        delete userResponse.password;

        res.json({ success: true, data: userResponse, message: 'Profile updated successfully' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Cập nhật Cài đặt User (Settings)
const updateUserSettings = async (req, res) => {
    try {
        const { settings } = req.body; 
        
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { $set: { settings: settings } }, 
            { new: true }
        ).select('-password');

        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        res.json({ success: true, data: user, message: 'Settings saved' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Xóa User (Hard delete)
const deleteUser = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        res.status(200).json({ success: true, message: 'User deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Upload Avatar
const uploadAvatar = async (req, res) => {
    try {
        const file = req.file;
        if (!file) return res.status(400).json({ success: false, message: 'No file uploaded' });

        const basePath = `${req.protocol}://${req.get('host')}/public/uploads/avatars/`;
        const fullUrl = `${basePath}${file.filename}`;

        const userId = req.user._id; 
        const user = await User.findByIdAndUpdate(userId, { avatar: fullUrl }, { new: true });

        res.status(200).json({ success: true, url: fullUrl });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// --- FAVORITES ---
const toggleFavorite = async (req, res) => {
    try {
        const userId = req.user?._id; 
        const { productId } = req.body;
        
        if (!userId) return res.status(401).json({ success: false, message: 'Auth failed' });

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        const isFavorited = user.favorites.includes(productId);
        
        if (isFavorited) {
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
        if (!userId) return res.status(401).json({ success: false, message: 'Auth failed' });

        const user = await User.findById(userId).populate('favorites');
        res.status(200).json({ success: true, data: user.favorites });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// ⭐️ EXPORT TẤT CẢ TẠI ĐÂY ⭐️
module.exports = {
    register,
    login, 
    forgotPassword,
    verifyOtp,
    setNewPassword,
    toggleFavorite,
    getFavorites,
    updateUser,
    uploadAvatar,
    getUsers,
    deleteUser,
    getUserAnalytics,
    updateUserProfile, // Đã định nghĩa ở trên
    updateUserSettings // Đã định nghĩa ở trên
};