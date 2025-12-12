const Category = require('../models/Category.model');

module.exports = {
    // 1. Lấy danh sách (Có lọc cho User App)
    getCategories: async (req, res) => {
        try {
            let filter = {};
            if (req.query.user) {
                filter = { isActive: true }; // User chỉ thấy cái đang hiện
            }
            const categoryList = await Category.find(filter).sort({ createdAt: -1 });
            res.status(200).json({ success: true, data: categoryList });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    },

    // 2. Lấy chi tiết 1 danh mục
    getCategoryById: async (req, res) => {
        try {
            const category = await Category.findById(req.params.id);
            if (!category) return res.status(404).json({ success: false, message: 'Không tìm thấy' });
            res.status(200).json({ success: true, data: category });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    },

    // 3. Tạo danh mục mới
    createCategory: async (req, res) => {
        try {
            let category = new Category({
                name: req.body.name,
                isActive: true 
            });
            category = await category.save();
            res.status(201).json({ success: true, data: category });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    },

    // 4. (MỚI) Cập nhật tên danh mục
    updateCategory: async (req, res) => {
        try {
            const category = await Category.findByIdAndUpdate(
                req.params.id,
                { name: req.body.name }, 
                { new: true } // Trả về data mới sau khi update
            );

            if (!category) return res.status(404).json({ success: false, message: 'Không tìm thấy' });

            res.status(200).json({ success: true, message: 'Cập nhật thành công', data: category });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    },

    // 5. Ẩn/Hiện danh mục (Toggle Status)
    toggleStatus: async (req, res) => {
        try {
            const category = await Category.findById(req.params.id);
            if (!category) return res.status(404).json({ success: false, message: 'Không tìm thấy' });

            category.isActive = !category.isActive;
            await category.save();
            
            const msg = category.isActive ? 'Đã hiện danh mục' : 'Đã ẩn danh mục';
            res.status(200).json({ success: true, message: msg, data: category });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    },

    // 6. Xóa vĩnh viễn
    deleteCategory: async (req, res) => {
        try {
            const category = await Category.findByIdAndDelete(req.params.id);
            if (!category) return res.status(404).json({ success: false, message: 'Không tìm thấy' });
            res.status(200).json({ success: true, message: 'Đã xóa vĩnh viễn' });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
};