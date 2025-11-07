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
            data: { id: user._id, name: user.name, email: user.email }
        });
    } catch (error) {
        console.error("ERROR: Register failed:", error);
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

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
            expiresIn: '30d',
        });
        
        // DEBUG: Log token creation success
        console.log(`DEBUG LOGIN: User ${user._id} logged in. Token created.`);

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

// (POST) /api/users/forgot-password
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ success: false, message: 'Vui lòng nhập email.' });
        const user = await User.findOne({ email });
        if (!user) return res.status(200).json({ success: true, message: 'Nếu email tồn tại sẽ nhận được OTP.' });
        
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 5 * 60000); 
        
        await PasswordReset.deleteMany({ email });
        await PasswordReset.create({ email, otp, expiresAt });
        await sendOtpEmail(email, otp);
        
        return res.json({ success: true, message: 'Nếu email tồn tại sẽ nhận được OTP.' });
    } catch (err) {
        console.error("ERROR: forgotPassword failed:", err);
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
        console.error("ERROR: verifyOtp failed:", err);
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
        console.error("ERROR: setNewPassword failed:", err);
        res.status(500).json({ success: false, message: 'Lỗi đổi mật khẩu.' });
    }
};

// Lấy danh sách users
exports.getUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json({ success: true, data: users });
    } catch (error) {
        console.error("ERROR: getUsers failed:", error);
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
        console.error("ERROR: getUserById failed:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// CẬP NHẬT HÀM updateUser
exports.updateUser = async (req, res) => {
    try {
        const userId = req.params.id;
        const { name, email, phone, address, avatar } = req.body;

        if (!name || !email) {
            return res.status(400).json({ success: false, message: 'Tên và Email không được để trống.' });
        }

        const updates = {};
        if (name) updates.name = name;
        if (email) updates.email = email;
        updates.phone = phone !== undefined ? phone : '';
        updates.address = address !== undefined ? address : '';
        updates.avatar = avatar !== undefined ? avatar : '';

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
            message: 'Cập nhật thông tin cá nhân thành công.',
            data: user
        });

    } catch (error) {
        console.error("ERROR: updateUser failed:", error);
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
        console.error("ERROR: deleteUser failed:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};


// Thêm/Xóa sản phẩm khỏi danh sách yêu thích
exports.toggleFavorite = async (req, res) => {
    try {
        // ✅ FIX 1: Dùng req.user?._id để lấy ID Mongoose an toàn và ngăn lỗi 500
        const userId = req.user?._id; 
        const { productId } = req.body;

        // DEBUG 4: Log User ID trước khi kiểm tra
        console.log("DEBUG TOGGLE: User ID received (from req.user):", userId);

        if (!userId) {
            // Trả về 401 Unauthorized thay vì lỗi 500 nếu auth middleware thất bại
            return res.status(401).json({ success: false, message: 'Xác thực thất bại. Vui lòng đăng nhập lại.' });
        }
        if (!productId) {
            return res.status(400).json({ success: false, message: 'Thiếu ID sản phẩm' });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
        }

        const isFavorited = user.favorites.includes(productId);
        let message;
        
        // DEBUG 5: Log hành động
        console.log(`DEBUG TOGGLE: Product ${productId} isFavorited: ${isFavorited}`);

        if (isFavorited) {
            await User.findByIdAndUpdate(userId, { $pull: { favorites: productId } });
            message = 'Đã xóa khỏi yêu thích';
        } else {
            await User.findByIdAndUpdate(userId, { $addToSet: { favorites: productId } });
            message = 'Đã thêm vào yêu thích';
        }

        res.status(200).json({ success: true, message: message });

    } catch (error) {
        // Ghi log chi tiết lỗi 500
        console.error("ERROR: toggleFavorite failed:", error);
        res.status(500).json({ success: false, message: 'Lỗi server khi cập nhật yêu thích.' });
    }
};

// Lấy danh sách yêu thích
exports.getFavorites = async (req, res) => {
    try {
        // ✅ FIX 2: Dùng req.user?._id để lấy ID Mongoose an toàn và ngăn lỗi 500
        const userId = req.user?._id; 
        
        // DEBUG 6: Log User ID trước khi truy vấn favorites
        console.log("DEBUG GET_FAV: User ID received (for query):", userId);

        if (!userId) {
            // Trả về 401 Unauthorized thay vì lỗi 500 nếu auth middleware thất bại
            return res.status(401).json({ success: false, message: 'Xác thực thất bại. Vui lòng đăng nhập lại.' });
        }

        // Populate (truy vấn) favorites
        const user = await User.findById(userId).populate('favorites').select('favorites');

        if (!user) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
        }
        
        // DEBUG 7: Log số lượng favorites tìm được
        console.log(`DEBUG GET_FAV: Found ${user.favorites.length} favorite items.`);

        res.status(200).json({ success: true, data: user.favorites });

    } catch (error) {
        // Ghi log chi tiết lỗi 500
        console.error("ERROR: getFavorites failed (500):", error);
        res.status(500).json({ success: false, message: 'Lỗi server khi tải danh sách yêu thích.' });
    }
};