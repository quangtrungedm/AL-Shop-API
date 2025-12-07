// controllers/product.controller.js
const Product = require('../models/Product.model');
const User = require('../models/User.model'); 
const { createNotification } = require('../helpers/notification-helper'); 

// --- Các hàm Lấy dữ liệu (Get) ---
exports.getProducts = async (req, res) => {
  try {
    // Cho Admin: Lấy TẤT CẢ sản phẩm
    const products = await Product.find().sort({ createdAt: -1 }); 
    res.json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getProductsByIds = async (req, res) => {
    try {
        const { ids } = req.query; 
        if (!ids) return res.status(400).json({ success: false, message: 'Thiếu tham số IDs' });

        const idArray = ids.split(',');
        const products = await Product.find({ '_id': { $in: idArray } });
        res.status(200).json({ success: true, data: products });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// --- HÀM TẠO SẢN PHẨM MỚI (Giữ nguyên) ---
exports.createProduct = async (req, res) => {
    try {
        // 1. Kiểm tra file ảnh
        const file = req.file;
        if (!file) {
            return res.status(400).json({ success: false, message: 'Vui lòng chọn ảnh cho sản phẩm.' });
        }

        // 2. Tạo đường dẫn URL đầy đủ cho ảnh
        const fileName = file.filename;
        const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`;
        const imagePath = `${basePath}${fileName}`;

        // 3. Tạo sản phẩm và lưu vào DB
        const product = await Product.create({
            name: req.body.name,
            description: req.body.description,
            price: req.body.price,
            category: req.body.category,
            stock: req.body.countInStock || req.body.stock || 0,
            image: [imagePath], 
        });

        if (!product) {
            return res.status(500).json({ success: false, message: 'Không thể tạo sản phẩm' });
        }

        // 4. (Tùy chọn) Gửi thông báo cho Admin
        const adminUser = await User.findOne({ role: 'admin' });
        if (adminUser) {
            await createNotification({
                userId: adminUser._id,
                title: `Sản phẩm mới: ${product.name}`,
                description: `Sản phẩm ID: ${product._id.toString().slice(-6)} đã được thêm vào kho.`,
                type: 'NEW_PRODUCT',
                referenceId: product._id,
                image: imagePath 
            });
        }

        res.status(201).json({ 
            success: true, 
            data: product,
            message: 'Thêm sản phẩm thành công!' 
        });

    } catch (error) {
        console.error("Lỗi Create Product:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// --- HÀM Cập nhật (Giữ nguyên) ---
exports.updateProduct = async (req, res) => {
    try {
        // 1. Tìm sản phẩm cũ để lấy lại ảnh cũ nếu không có ảnh mới
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
        }

        // 2. Xử lý ảnh
        const file = req.file;
        let imagePath;

        if (file) {
            // Trường hợp A: Người dùng chọn ảnh mới -> Tạo link mới
            const fileName = file.filename;
            const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`;
            imagePath = [`${basePath}${fileName}`]; 
        } else {
            // Trường hợp B: Không chọn ảnh mới -> Giữ nguyên ảnh cũ
            imagePath = product.image;
        }

        // 3. Cập nhật vào DB
        const updatedProduct = await Product.findByIdAndUpdate(
            req.params.id,
            {
                name: req.body.name,
                description: req.body.description,
                price: req.body.price,
                category: req.body.category,
                stock: req.body.countInStock || req.body.stock,
                image: imagePath,
            },
            { new: true } 
        );

        res.json({ success: true, data: updatedProduct, message: 'Cập nhật thành công!' });

    } catch (error) {
        console.error("Lỗi Update:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ⭐️ HÀM MỚI: Tắt/Mở trạng thái sản phẩm (Thay thế cho deleteProduct) ⭐️
exports.toggleProductStatus = async (req, res) => {
    try {
        const { id } = req.params;
        // Frontend gửi trạng thái mới trong body, ví dụ: { isActive: false }
        const { isActive } = req.body; 

        if (typeof isActive !== 'boolean') {
            return res.status(400).json({ success: false, message: 'Trạng thái isActive phải là Boolean.' });
        }

        // Tìm và chỉ cập nhật trường isActive
        const updatedProduct = await Product.findByIdAndUpdate(
            id,
            { isActive: isActive },
            { new: true }
        );

        if (!updatedProduct) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
        }
        
        const action = isActive ? 'hiển thị' : 'ẩn';
        res.json({ success: true, message: `Đã ${action} sản phẩm thành công!`, data: updatedProduct });

    } catch (error) {
        console.error("Lỗi Toggle Status:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Hàm deleteProduct cũ đã bị loại bỏ/comment.