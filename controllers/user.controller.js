// [File] controllers/user.controller.js

const User = require('../models/User.model');
const Product = require('../models/Product.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const PasswordReset = require('../models/PasswordReset.model');
const fs = require('fs');
const path = require('path');

const { sendEmail } = require('../helpers/send-email'); 

// --- HÀM XÁC THỰC VÀ ĐĂNG NHẬP (GIỮ NGUYÊN) ---
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
        
        const user = await User.create({ name, email, password }); 
        
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

// ... (forgotPassword, verifyOtp, setNewPassword - GIỮ NGUYÊN) ...
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

const setNewPassword = async (req, res) => {
    
    try {
        const { email, newPassword } = req.body; 
        
        if (!email || !newPassword) {
            return res.status(400).json({ 
                success: false, 
                message: 'Please provide both email and new password.' 
            });
        }

        const reset = await PasswordReset.findOne({ email, verified: true });
        
        if (!reset) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid or unverified password reset session.' 
            });
        }

        const now = Date.now();
        if (reset.expiresAt < now) {
            await PasswordReset.deleteMany({ email });
            return res.status(400).json({ 
                success: false, 
                message: 'Password reset session has expired. Please request again.' 
            });
        }
        
        const user = await User.findOne({ email });
        if (!user) {
            await PasswordReset.deleteMany({ email });
            return res.status(404).json({ 
                success: false, 
                message: 'User account not found.' 
            });
        }

        user.password = newPassword;
        await user.save();
        
        await PasswordReset.deleteMany({ email });

        res.json({ 
            success: true, 
            message: 'Password changed successfully. Please login again.' 
        });

    } catch (err) {
        console.error("ERROR: setNewPassword failed:", err);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error while updating password.' 
        });
    }
};
// --- KẾT THÚC HÀM XÁC THỰC ---


// --- HÀM QUẢN LÝ USER CƠ BẢN (BỔ SUNG) ---

// Cập nhật thông tin User (PUT /api/users/:id)
const updateUser = async (req, res) => {
    try {
        const userId = req.params.id;
        const requestingUser = req.user;
        const updateFields = req.body;
        
        // 1. Kiểm tra quyền: Chỉ admin hoặc chính chủ tài khoản mới được cập nhật
        if (requestingUser.role !== 'admin' && requestingUser.id !== userId) {
            return res.status(403).json({ 
                success: false, 
                message: 'Bạn không có quyền cập nhật thông tin người dùng này.' 
            });
        }

        // 2. Không cho phép cập nhật role/password/favorites từ API này
        delete updateFields.role;
        delete updateFields.password;
        delete updateFields.favorites;


        // 3. Xử lý email trùng lặp (chỉ khi email bị thay đổi)
        if (updateFields.email) {
            const existingUser = await User.findOne({ email: updateFields.email, _id: { $ne: userId } });
            if (existingUser) {
                // Trả về lỗi 400 để client hiển thị dưới input
                return res.status(400).json({ 
                    success: false, 
                    message: `Email này (${updateFields.email}) đã được sử dụng bởi tài khoản khác.` 
                });
            }
        }
        
        // 4. Cập nhật User
        const updatedUser = await User.findByIdAndUpdate(userId, updateFields, { new: true, runValidators: true });

        if (!updatedUser) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng.' });
        }
        
        // Trả về user mà không có password
        const userWithoutPassword = updatedUser.toObject();
        delete userWithoutPassword.password;

        res.status(200).json({ success: true, message: 'Cập nhật thành công', data: userWithoutPassword });

    } catch (error) {
        console.error("ERROR: updateUser failed:", error);
        
        if (error.name === 'ValidationError') {
             return res.status(400).json({ success: false, message: error.message });
        }
        
        res.status(500).json({ success: false, message: error.message || 'Lỗi server khi cập nhật người dùng.' });
    }
};


// Xử lý Upload Avatar (POST /api/upload/avatar)
const uploadAvatar = async (req, res) => {
    try {
        const file = req.file;
        if (!file) return res.status(400).json({ success: false, message: 'Chưa chọn ảnh hoặc ảnh không hợp lệ.' });

        // Tạo đường dẫn URL để frontend truy cập
        // Lưu ý: Đường dẫn này phải khớp với cấu hình static folder trong server.js
        const basePath = `${req.protocol}://${req.get('host')}/public/uploads/avatars/`;
        const fullUrl = `${basePath}${file.filename}`;

        // Lưu đường dẫn ảnh vào Database (chỉ lưu phần đuôi hoặc full URL tùy logic team bạn)
        // Ở đây mình lưu Full URL cho dễ hiển thị
        const userId = req.user._id; 
        
        const user = await User.findByIdAndUpdate(
            userId,
            { avatar: fullUrl },
            { new: true } // Trả về data mới sau khi update
        );

        if (!user) return res.status(404).json({ success: false, message: 'User không tồn tại.' });

        res.status(200).json({ 
            success: true, 
            message: 'Avatar cập nhật thành công', 
            url: fullUrl 
        });

    } catch (error) {
        console.error("Upload Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};


// --- HÀM QUẢN LÝ YÊU THÍCH (GIỮ NGUYÊN) ---
const toggleFavorite = async (req, res) => {
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

const getFavorites = async (req, res) => {
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
// ⭐️ HÀM MỚI 1: Lấy danh sách tất cả người dùng
const getUsers = async (req, res) => {
    try {
        // Lấy tất cả user, trừ trường password ra (bảo mật)
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: users });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ⭐️ HÀM MỚI 2: Xóa người dùng
const deleteUser = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'Người dùng không tồn tại' });
        }
        res.status(200).json({ success: true, message: 'Đã xóa người dùng thành công' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ⭐️ EXPORT CÁC HÀM ⭐️
module.exports = {
    register,
    login, 
    forgotPassword,
    verifyOtp,
    setNewPassword,
    toggleFavorite,
    getFavorites,
    // BỔ SUNG
    updateUser,
    uploadAvatar,
    getUsers,
    deleteUser
};