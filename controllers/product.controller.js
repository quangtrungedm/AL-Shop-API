// controllers/product.controller.js
const Product = require('../models/Product.model');
const User = require('../models/User.model'); 
const { createNotification } = require('../helpers/notification-helper'); 

// --- Các hàm Lấy dữ liệu (Get) ---
exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 }); // Sắp xếp mới nhất lên đầu
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

// --- ⭐️ HÀM QUAN TRỌNG: TẠO SẢN PHẨM MỚI ---
exports.createProduct = async (req, res) => {
    try {
        // 1. Kiểm tra file ảnh
        const file = req.file;
        if (!file) {
            return res.status(400).json({ success: false, message: 'Vui lòng chọn ảnh cho sản phẩm.' });
        }

        // 2. Tạo đường dẫn URL đầy đủ cho ảnh
        // Kết quả sẽ là: http://localhost:4000/public/uploads/ten-anh.jpg
        const fileName = file.filename;
        const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`;
        const imagePath = `${basePath}${fileName}`;

        // 3. Tạo sản phẩm và lưu vào DB
        const product = await Product.create({
            name: req.body.name,
            description: req.body.description,
            price: req.body.price,
            category: req.body.category,
            // Mapping: Frontend gửi 'countInStock', DB lưu là 'stock'
            stock: req.body.countInStock || req.body.stock || 0,
            // Lưu ảnh vào mảng (do Model định nghĩa image: [String])
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
                image: imagePath // Lưu link ảnh vào thông báo luôn
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

// --- Các hàm Cập nhật/Xóa ---
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
            imagePath = [`${basePath}${fileName}`]; // Lưu mảng mới
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
                // Mapping trường stock (ưu tiên countInStock gửi từ form)
                stock: req.body.countInStock || req.body.stock,
                image: imagePath,
            },
            { new: true } // Trả về data mới sau khi update
        );

        res.json({ success: true, data: updatedProduct, message: 'Cập nhật thành công!' });

    } catch (error) {
        console.error("Lỗi Update:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.deleteProduct = async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Đã xóa sản phẩm' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};