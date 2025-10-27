const User = require('../models/User.model');
const Product = require('../models/Product.model'); // Lấy từ nhánh 'phuc'
const bcrypt = require('bcrypt'); // Lấy từ 'master' (bỏ bcryptjs để thống nhất)
const jwt = require('jsonwebtoken'); // Lấy từ nhánh 'phuc'
const PasswordReset = require('../models/PasswordReset.model'); // Lấy từ 'master'
const { sendOtpEmail } = require('../helpers/send-email'); // Lấy từ 'master'

// Register (Lấy hàm 'register' mới nhất từ master)
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

// Lấy danh sách users (Hàm chung)
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// BỎ hàm 'createUser' cũ từ nhánh 'phuc' vì đã có hàm 'register' mới


// HÀM MỚI: Đăng nhập (Lấy từ nhánh 'phuc')
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

// Lấy thông tin 1 user (Hàm chung)
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy user' });
    }
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Cập nhật user (Hàm chung)
exports.updateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Xóa user (Hàm chung)
exports.deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Đã xóa user' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// (POST) /api/users/forgot-password (Lấy từ 'master')
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
    console.error(err);
    res.status(500).json({ success: false, message: 'Có lỗi khi gửi OTP.' });
  }
};

// (POST) /api/users/verify-otp (Lấy từ 'master')
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

// (POST) /api/users/set-new-password (Lấy từ 'master')
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

// HÀM MỚI: Thêm/Xóa Yêu thích (Lấy từ nhánh 'phuc')
exports.toggleFavorite = async (req, res) => {
    try {
        const { id } = req.user; // Lấy từ authMiddleware
        const { productId } = req.params; 

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
        }

        const user = await User.findById(id);
        if (!user) {
             return res.status(404).json({ success: false, message: 'Không tìm thấy user' });
        }

        const isFavorited = user.favorites.includes(productId);

        if (isFavorited) {
            await user.updateOne({ $pull: { favorites: productId } });
            res.json({ success: true, message: 'Đã xóa khỏi danh sách yêu thích' });
        } else {
            await user.updateOne({ $push: { favorites: productId } });
            res.json({ success: true, message: 'Đã thêm vào danh sách yêu thích' });
        }

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};