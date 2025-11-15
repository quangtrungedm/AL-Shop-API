// controllers/user.controller.js

const User = require('../models/User.model');
const Product = require('../models/Product.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const PasswordReset = require('../models/PasswordReset.model');

const { sendEmail } = require('../helpers/send-email'); 

// --- HÀM XÁC THỰC VÀ ĐĂNG NHẬP ---

// Register
const register = async (req, res) => { // Đã sửa: dùng const
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ thông tin.' });
        }
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Email đã tồn tại.' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({ name, email, password: hashedPassword });
        
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

// Đăng nhập
const loginUser = async (req, res) => { // Đã sửa: dùng const
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

// --- HÀM QUÊN MẬT KHẨU ---

// (POST) /api/users/forgot-password
const forgotPassword = async (req, res) => { // Đã sửa: dùng const
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
            console.error(`ERROR SENDGRID: Không thể gửi OTP cho ${email}. Vui lòng kiểm tra cấu hình SendGrid/API Key.`);
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

// (POST) /api/users/verify-otp
const verifyOtp = async (req, res) => { // Đã sửa: dùng const
    try {
        const { email, otp } = req.body;
        if (!email || !otp) return res.status(400).json({ success: false, message: 'Vui lòng nhập đầy đủ email và OTP.' });

        const now = Date.now();
        const reset = await PasswordReset.findOne({ email, otp });
        
    
        if (!reset) {
            return res.status(400).json({ success: false, message: 'Mã xác thực không hợp lệ hoặc đã hết hạn.' });
        }
        
        if (reset.expiresAt < now) {
            console.log(`DEBUG VERIFY: OTP ${otp} đã hết hạn.`);
            await PasswordReset.deleteMany({ email });
            return res.status(400).json({ success: false, message: 'OTP đã hết hạn. Vui lòng yêu cầu OTP mới.' });
        }
        
        if (reset.verified) {
            return res.status(400).json({ success: false, message: 'OTP đã được xác minh trước đó.' });
        }


        reset.verified = true;
        await reset.save();
        console.log(`DEBUG VERIFY: OTP ${otp} cho ${email} đã được xác minh thành công và lưu vào DB.`);


        res.json({ success: true, message: 'Xác thực OTP thành công. Bạn có thể đặt lại mật khẩu.' });
    } catch (err) {
        console.error("ERROR: verifyOtp failed:", err);
        res.status(500).json({ success: false, message: 'Lỗi server khi xác thực OTP.' });
    }
};

// (POST) /api/users/set-new-password
const setNewPassword = async (req, res) => { // Đã sửa: dùng const

    console.log("DEBUG SET_PASS: received body:", req.body);
    
    try {
        const { email, newPassword } = req.body; 
        
        if (!email || !newPassword) {
            console.log("DEBUG SET_PASS: Lỗi 400 - Thiếu email hoặc newPassword.");
            return res.status(400).json({ success: false, message: 'Vui lòng nhập email và mật khẩu mới.' });
        }


        const reset = await PasswordReset.findOne({ email, verified: true });
        console.log(`DEBUG SET_PASS: PasswordReset record found (verified: true): ${reset ? 'Có' : 'Không'}`);
        

        if (!reset) {
            console.log("DEBUG SET_PASS: Lỗi 400 - Yêu cầu đặt lại mật khẩu không hợp lệ.");
            return res.status(400).json({ success: false, message: 'Phiên đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.' });
        }


        const now = Date.now();
        if (reset.expiresAt < now) {
            console.log("DEBUG SET_PASS: Lỗi 400 - Phiên đã hết hạn.");
            await PasswordReset.deleteMany({ email });
            return res.status(400).json({ success: false, message: 'Phiên đặt lại mật khẩu đã hết hạn. Vui lòng yêu cầu lại.' });
        }
        

        const user = await User.findOne({ email });
        if (!user) {
            await PasswordReset.deleteMany({ email });
            return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản để cập nhật.' });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();
        

        await PasswordReset.deleteMany({ email });
        console.log(`DEBUG SET_PASS: Mật khẩu của ${email} đã đổi thành công. Reset record đã xóa.`);

        res.json({ success: true, message: 'Đổi mật khẩu thành công. Vui lòng đăng nhập lại.' });
    } catch (err) {
        console.error("ERROR: setNewPassword failed:", err);
        res.status(500).json({ success: false, message: 'Lỗi server khi đổi mật khẩu.' });
    }
};

// --- CÁC HÀM QUẢN LÝ USER VÀ YÊU THÍCH ---

// Lấy danh sách users
const getUsers = async (req, res) => { // Đã sửa: dùng const
    try {
        const users = await User.find().select('-password');
        res.json({ success: true, data: users });
    } catch (error) {
        console.error("ERROR: getUsers failed:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Lấy thông tin 1 user
const getUserById = async (req, res) => { // Đã sửa: dùng const
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
const updateUser = async (req, res) => { // Đã sửa: dùng const
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
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'Email này đã được sử dụng bởi người khác.' });
        }
        console.error("ERROR: updateUser failed:", error);
        res.status(400).json({ success: false, message: error.message });
    }
};

// Xóa user
const deleteUser = async (req, res) => { // Đã sửa: dùng const
    try {
        await User.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Đã xóa user' });
    } catch (error) {
        console.error("ERROR: deleteUser failed:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};


// Thêm/Xóa sản phẩm khỏi danh sách yêu thích
const toggleFavorite = async (req, res) => { // Đã sửa: dùng const
    try {
        const userId = req.user?._id; 
        const { productId } = req.body;
        
        if (!userId) {
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
        
        if (isFavorited) {
            await User.findByIdAndUpdate(userId, { $pull: { favorites: productId } });
            message = 'Đã xóa khỏi yêu thích';
        } else {
            await User.findByIdAndUpdate(userId, { $addToSet: { favorites: productId } });
            message = 'Đã thêm vào yêu thích';
        }

        res.status(200).json({ success: true, message: message });

    } catch (error) {
        console.error("ERROR: toggleFavorite failed:", error);
        res.status(500).json({ success: false, message: 'Lỗi server khi cập nhật yêu thích.' });
    }
};

// Lấy danh sách yêu thích
const getFavorites = async (req, res) => { // Đã sửa: dùng const
    try {
        const userId = req.user?._id; 

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Xác thực thất bại. Vui lòng đăng nhập lại.' });
        }

        const user = await User.findById(userId).populate('favorites').select('favorites');

        if (!user) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
        }
        
        res.status(200).json({ success: true, data: user.favorites });

    } catch (error) {
        console.error("ERROR: getFavorites failed (500):", error);
        res.status(500).json({ success: false, message: 'Lỗi server khi tải danh sách yêu thích.' });
    }
};

// ⭐️ ĐẢM BẢO TẤT CẢ CÁC HÀM ĐƯỢC XUẤT RA ⭐️
module.exports = {
    register,
    loginUser,
    forgotPassword,
    verifyOtp,
    setNewPassword,
    toggleFavorite,
    getFavorites,
    getUsers,
    getUserById,
    updateUser,
    deleteUser,
};