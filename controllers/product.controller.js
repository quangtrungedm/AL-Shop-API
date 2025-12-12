// controllers/product.controller.js

const Product = require('../models/Product.model');
const Category = require('../models/Category.model'); // [MỚI] Import model Category
const User = require('../models/User.model'); 
const { createNotification } = require('../helpers/notification-helper'); 

// ==========================================
// 1. CÁC HÀM LẤY DỮ LIỆU (GET)
// ==========================================

// Lấy danh sách tất cả sản phẩm
exports.getProducts = async (req, res) => {
    try {
        // [QUAN TRỌNG] Thêm .populate('category') để lấy chi tiết danh mục
        const products = await Product.find()
            .populate('category') 
            .sort({ createdAt: -1 }); 

        res.json({ success: true, data: products });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Lấy chi tiết 1 sản phẩm theo ID
exports.getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate('category'); // [MỚI] Populate category

        if (!product) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
        }
        res.json({ success: true, data: product });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Lấy danh sách sản phẩm theo mảng ID
exports.getProductsByIds = async (req, res) => {
    try {
        const { ids } = req.query; 
        if (!ids) return res.status(400).json({ success: false, message: 'Thiếu tham số IDs' });

        const idArray = ids.split(',');
        const products = await Product.find({ '_id': { $in: idArray } })
            .populate('category'); // [MỚI] Populate category

        res.status(200).json({ success: true, data: products });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ==========================================
// 2. HÀM TẠO SẢN PHẨM MỚI (POST)
// ==========================================

exports.createProduct = async (req, res) => {
    try {
        // --- BƯỚC 1: Validate Danh mục (MỚI) ---
        // Kiểm tra xem ID danh mục gửi lên có tồn tại không
        if (req.body.category) {
             const category = await Category.findById(req.body.category);
             if (!category) {
                 return res.status(400).json({ success: false, message: 'Danh mục không hợp lệ hoặc không tồn tại.' });
             }
        } else {
             return res.status(400).json({ success: false, message: 'Vui lòng chọn danh mục.' });
        }

        // --- BƯỚC 2: Kiểm tra file ảnh ---
        const file = req.file;
        if (!file) {
            return res.status(400).json({ success: false, message: 'Vui lòng chọn ảnh cho sản phẩm.' });
        }

        // Tạo đường dẫn URL ảnh
        const fileName = file.filename;
        const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`;
        const imagePath = `${basePath}${fileName}`;

        // --- BƯỚC 3: Tạo sản phẩm ---
        const product = new Product({
            name: req.body.name,
            description: req.body.description,
            price: req.body.price,
            category: req.body.category, // ID danh mục
            stock: req.body.countInStock || req.body.stock || 0,
            image: [imagePath], 
            isActive: true // Mặc định là hiển thị
        });

        // Lưu vào DB
        await product.save();

        if (!product) {
            return res.status(500).json({ success: false, message: 'Không thể tạo sản phẩm' });
        }

        // --- BƯỚC 4: Gửi thông báo cho Admin (Tùy chọn) ---
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

// ==========================================
// 3. HÀM CẬP NHẬT SẢN PHẨM (PUT)
// ==========================================

exports.updateProduct = async (req, res) => {
    try {
        // [MỚI] Validate Category nếu người dùng có gửi lên category mới
        if (req.body.category) {
            const category = await Category.findById(req.body.category);
            if (!category) {
                return res.status(400).json({ success: false, message: 'Danh mục không hợp lệ.' });
            }
        }

        // Tìm sản phẩm cũ
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
        }

        // Xử lý ảnh (Giữ ảnh cũ hoặc thay ảnh mới)
        const file = req.file;
        let imagePath;

        if (file) {
            const fileName = file.filename;
            const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`;
            imagePath = [`${basePath}${fileName}`]; 
        } else {
            imagePath = product.image;
        }

        // Cập nhật
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
            { new: true } // Trả về dữ liệu mới sau khi update
        );

        res.json({ success: true, data: updatedProduct, message: 'Cập nhật thành công!' });

    } catch (error) {
        console.error("Lỗi Update:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ==========================================
// 4. HÀM TẮT/MỞ TRẠNG THÁI (Ẩn/Hiện)
// ==========================================

exports.toggleProductStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body; 

        if (typeof isActive !== 'boolean') {
            return res.status(400).json({ success: false, message: 'Trạng thái isActive phải là Boolean.' });
        }

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