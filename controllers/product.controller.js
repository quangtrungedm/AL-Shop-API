// controllers/product.controller.js

const Product = require('../models/Product.model');

// Lấy danh sách sản phẩm
exports.getProducts = async (req, res) => {
    // ⭐️ DEBUG 1: Xác nhận Controller đã được gọi
    console.log("DEBUG PRODUCT: Controller getProducts đã được gọi."); 
    
    try {
        const products = await Product.find();
        
        // ⭐️ DEBUG 2: Xác nhận dữ liệu được tìm thấy
        console.log(`DEBUG PRODUCT: Tìm thấy ${products.length} sản phẩm.`); 
        
        // Gửi JSON thành công
        res.status(200).json({ success: true, data: products });
    } catch (error) {
        // ⭐️ DEBUG 3: Xác nhận nếu có lỗi xảy ra trong khối try
        console.error("DEBUG PRODUCT ERROR: Lỗi khi truy vấn DB:", error.message);
        
        // Gửi JSON lỗi 500
        res.status(500).json({ success: false, message: error.message });
    }
};

// Tạo sản phẩm mới
exports.createProduct = async (req, res) => {
    try {
        const product = await Product.create(req.body);
        res.status(201).json({ success: true, data: product });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// Lấy thông tin 1 sản phẩm
exports.getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
        }
        res.json({ success: true, data: product });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Cập nhật sản phẩm
exports.updateProduct = async (req, res) => {
    try {
        const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json({ success: true, data: product });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// Xóa sản phẩm
exports.deleteProduct = async (req, res) => {
    try {
        await Product.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Đã xóa sản phẩm' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Lấy nhiều sản phẩm theo mảng ID
exports.getProductsByIds = async (req, res) => {
    try {
        const { ids } = req.query; 

        if (!ids) {
            return res.status(400).json({ success: false, message: 'Không có ID nào được cung cấp' });
        }

        const idArray = ids.split(',');
        const products = await Product.find({
            '_id': { $in: idArray }
        });

        res.status(200).json({ success: true, data: products });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};