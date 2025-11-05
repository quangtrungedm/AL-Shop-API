const User = require('../models/User.model');
const Product = require('../models/Product.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const PasswordReset = require('../models/PasswordReset.model');
const { sendOtpEmail } = require('../helpers/send-email');

// Register
exports.register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: 'Please fill in all information' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name,
            email,
            password: hashedPassword
        });

        res.status(201).json({ 
            success: true, 
            message: 'Registration successful',
            data: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// Đăng nhập
exports.loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: 'Email không tồn tại' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Sai mật khẩu' });
        }
        
        // Tạo Token
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
            expiresIn: '30d', // Token hết hạn sau 30 ngày
        });
        
        // Trả về token và thông tin user (trừ password)
        const userWithoutPassword = user.toObject();
        delete userWithoutPassword.password;
        
        res.json({ 
            success: true, 
            token,
            data: userWithoutPassword // Gửi kèm data user để app lưu lại
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// (POST) /api/users/forgot-password
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ success: false, message: 'Vui lòng nhập email.' });
        const user = await User.findOne({ email });
        if (!user) return res.status(200).json({ success: true, message: 'Nếu email tồn tại sẽ nhận được OTP.' });
        
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 5 * 60000); // 5 phút
        
        await PasswordReset.deleteMany({ email });
        await PasswordReset.create({ email, otp, expiresAt });
        await sendOtpEmail(email, otp);
        
        return res.json({ success: true, message: 'Nếu email tồn tại sẽ nhận được OTP.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Có lỗi khi gửi OTP.' });
    }
};

// (POST) /api/users/verify-otp
exports.verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) return res.status(400).json({ success: false, message: 'Vui lòng nhập đầy đủ email và OTP.' });
        
        const now = new Date();
        const reset = await PasswordReset.findOne({ email, otp, expiresAt: { $gt: now } });
        
        if (!reset) return res.status(400).json({ success: false, message: 'OTP không hợp lệ hoặc đã hết hạn.' });
        if (reset.verified)
            return res.status(400).json({ success: false, message: 'OTP đã được xác minh!' });
        
        reset.verified = true;
        await reset.save();
        
        res.json({ success: true, message: 'Xác thực OTP thành công. Bạn có thể đặt lại mật khẩu.' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Lỗi xác thực OTP.' });
    }
};

// (POST) /api/users/set-new-password
exports.setNewPassword = async (req, res) => {
    try {
        const { email, newPassword } = req.body;
        if (!email || !newPassword)
            return res.status(400).json({ success: false, message: 'Vui lòng nhập email và mật khẩu mới.' });
        
        const reset = await PasswordReset.findOne({ email, verified: true });
        if (!reset)
            return res.status(400).json({ success: false, message: 'Chưa xác thực OTP hoặc OTP sai!' });
        
        if (reset.expiresAt < Date.now())
            return res.status(400).json({ success: false, message: 'OTP đã hết hạn.' });
        
        const user = await User.findOne({ email });
        if (!user)
            return res.status(400).json({ success: false, message: 'Không tìm thấy tài khoản.' });
        
        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();
        await PasswordReset.deleteMany({ email });
        
        res.json({ success: true, message: 'Đổi mật khẩu thành công.' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Lỗi đổi mật khẩu.' });
    }
};

// Lấy danh sách users
exports.getUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json({ success: true, data: users });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Lấy thông tin 1 user
exports.getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy user' });
        }
        res.json({ success: true, data: user });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// --- HÀM ĐÃ SỬA: CẬP NHẬT USER VỚI PHONE VÀ ADDRESS ---
// CẬP NHẬT HÀM updateUser
exports.updateUser = async (req, res) => {
    try {
        const userId = req.params.id;
        // ⭐️ THÊM 'avatar' vào destructuring
        const { name, email, phone, address, avatar } = req.body; 

        // 1. Kiểm tra tính hợp lệ cơ bản
        if (!name || !email) {
            return res.status(400).json({ success: false, message: 'Tên và Email không được để trống.' });
        }
        
        // 2. Chuẩn bị đối tượng cập nhật
        const updates = {};
        if (name) updates.name = name;
        if (email) updates.email = email;
        
        // Cập nhật các trường mới
        updates.phone = phone !== undefined ? phone : '';
        updates.address = address !== undefined ? address : ''; 
        // ⭐️ CẬP NHẬT: Thêm avatar
        updates.avatar = avatar !== undefined ? avatar : ''; 
        
        // 3. Thực hiện cập nhật
        const user = await User.findByIdAndUpdate(
            userId, 
            { $set: updates }, 
            { new: true, runValidators: true } 
        ).select('-password'); 

        if (!user) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng để cập nhật.' });
        }
        
        // 4. Trả về thông tin user đã cập nhật
        res.status(200).json({ 
            success: true, 
            message: 'Cập nhật thông tin cá nhân thành công.',
            data: user 
        });
        
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'Email này đã được sử dụng bởi người khác.' });
        }
        res.status(400).json({ success: false, message: error.message });
    }
};

// Xóa user
exports.deleteUser = async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Đã xóa user' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// --- LOGIC YÊU THÍCH (GIỮ PHIÊN BẢN MỚI NHẤT) ---

// Thêm/Xóa sản phẩm khỏi danh sách yêu thích
exports.toggleFavorite = async (req, res) => {
    try {
        const { userId } = req.user.id; 
        const { productId } = req.body; // Giả định frontend gửi qua body

        if (!productId) {
            return res.status(400).json({ success: false, message: 'Thiếu ID sản phẩm' });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
        }

        const isFavorited = user.favorites.includes(productId);
        let message;

        if (isFavorited) {
            await User.findByIdAndUpdate(req.user.id, {
                $pull: { favorites: productId }
            });
            message = 'Đã xóa khỏi yêu thích';
        } else {
            await User.findByIdAndUpdate(req.user.id, {
                $addToSet: { favorites: productId }
            });
            message = 'Đã thêm vào yêu thích';
        }

        res.status(200).json({
            success: true,
            message: message
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Lấy danh sách yêu thích
exports.getFavorites = async (req, res) => {
    try {
        const userId = req.user.id; 
        
        const user = await User.findById(userId).populate('favorites').select('favorites');

        if (!user) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
        }
        
        res.status(200).json({ success: true, data: user.favorites });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};