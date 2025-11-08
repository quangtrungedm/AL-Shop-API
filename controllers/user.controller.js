// controllers/user.controller.js

const User = require('../models/User.model');
const Product = require('../models/Product.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const PasswordReset = require('../models/PasswordReset.model');
// ⭐️ Sử dụng tên hàm 'sendEmail' đã được export từ helpers
const { sendEmail } = require('../helpers/send-email'); 


// --- HÀM XÁC THỰC VÀ ĐĂNG NHẬP (Không đổi) ---

// Register
exports.register = async (req, res) => {
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

// --- HÀM QUÊN MẬT KHẨU (TÍCH HỢP SENDGRID) ---

// (POST) /api/users/forgot-password
exports.forgotPassword = async (req, res) => {
    const { email } = req.body;
    
    if (!email) {
        return res.status(400).json({ success: false, message: 'Vui lòng nhập email.' });
    }

    try {
        const user = await User.findOne({ email });

        // ⚠️ Bảo mật: Nếu không tìm thấy user, vẫn trả về thành công
        if (!user) {
            return res.status(200).json({ 
                success: true, 
                message: 'Nếu email tồn tại, OTP đã được gửi đi.' 
            });
        }

        // 1. Tạo OTP và thời gian hết hạn (5 phút)
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = Date.now() + 5 * 60000; // 5 phút tính bằng milliseconds

        // 2. Xóa OTP cũ và tạo/cập nhật OTP mới vào DB
        await PasswordReset.findOneAndUpdate(
            { email },
            { otp: otp, expiresAt: expiresAt, verified: false },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        
        // 3. Chuẩn bị nội dung email
        const emailContent = `
            <h1>Mã xác nhận Đặt lại mật khẩu AL-Shop</h1>
            <p>Mã OTP của bạn là: <strong>${otp}</strong></p>
            <p>Mã này sẽ hết hạn trong 5 phút. Vui lòng không chia sẻ.</p>
        `;

        // 4. Gửi email qua SendGrid
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
exports.verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) return res.status(400).json({ success: false, message: 'Vui lòng nhập đầy đủ email và OTP.' });

        const now = Date.now();
        const reset = await PasswordReset.findOne({ email, otp });
        
        // ⭐️ DEBUG VERIFY 1: Kiểm tra xem bản ghi có được tìm thấy không
        console.log(`DEBUG VERIFY: Finding OTP for ${email}. Found: ${reset ? 'Có' : 'Không'}`);
        
        if (!reset) {
             return res.status(400).json({ success: false, message: 'OTP không hợp lệ.' });
        }
        
        if (reset.expiresAt < now) {
            console.log(`DEBUG VERIFY: OTP ${otp} đã hết hạn.`);
            await PasswordReset.deleteMany({ email }); // Xóa OTP hết hạn
            return res.status(400).json({ success: false, message: 'OTP đã hết hạn. Vui lòng yêu cầu OTP mới.' });
        }
        
        if (reset.verified) {
            return res.status(400).json({ success: false, message: 'OTP đã được xác minh trước đó.' });
        }

        // Xác minh thành công
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
exports.setNewPassword = async (req, res) => {
    // ⭐️ DEBUG SET_PASS 1: Kiểm tra dữ liệu nhận được từ Frontend
    console.log("DEBUG SET_PASS: received body:", req.body);
    
    try {
        const { email, newPassword } = req.body;
        
        if (!email || !newPassword) {
            console.log("DEBUG SET_PASS: Lỗi 400 - Thiếu email hoặc newPassword.");
            return res.status(400).json({ success: false, message: 'Vui lòng nhập email và mật khẩu mới.' });
        }

        // ⭐️ DEBUG SET_PASS 2: Kiểm tra bản ghi OTP sau khi tìm kiếm
        const reset = await PasswordReset.findOne({ email, verified: true });
        console.log(`DEBUG SET_PASS: PasswordReset record found (verified: true): ${reset ? 'Có' : 'Không'}`);
        
        // 1. Kiểm tra trạng thái đã xác minh
        if (!reset) {
            console.log("DEBUG SET_PASS: Lỗi 400 - OTP chưa được xác thực (verified != true) hoặc đã hết hạn.");
            return res.status(400).json({ success: false, message: 'Yêu cầu đặt lại mật khẩu không hợp lệ hoặc chưa xác thực OTP.' });
        }

        // 2. Kiểm tra lại thời gian hết hạn (Phòng trường hợp OTP hết hạn sau khi verify)
        const now = Date.now();
        if (reset.expiresAt < now) {
             console.log("DEBUG SET_PASS: Lỗi 400 - Phiên đã hết hạn.");
             await PasswordReset.deleteMany({ email });
             return res.status(400).json({ success: false, message: 'Phiên đặt lại mật khẩu đã hết hạn. Vui lòng yêu cầu lại.' });
        }
        
        // 3. Cập nhật mật khẩu
        const user = await User.findOne({ email });
        if (!user) {
             return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản để cập nhật.' });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();
        
        // 4. Xóa bản ghi PasswordReset sau khi thành công
        await PasswordReset.deleteMany({ email });
        console.log(`DEBUG SET_PASS: Mật khẩu của ${email} đã đổi thành công. Reset record đã xóa.`);

        res.json({ success: true, message: 'Đổi mật khẩu thành công. Vui lòng đăng nhập lại.' });
    } catch (err) {
        console.error("ERROR: setNewPassword failed:", err);
        res.status(500).json({ success: false, message: 'Lỗi server khi đổi mật khẩu.' });
    }
};

// --- CÁC HÀM QUẢN LÝ USER VÀ YÊU THÍCH (Không đổi) ---

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
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'Email này đã được sử dụng bởi người khác.' });
        }
        console.error("ERROR: updateUser failed:", error);
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
exports.getFavorites = async (req, res) => {
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