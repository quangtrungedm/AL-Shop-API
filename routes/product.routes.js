// routes/products.js
const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');

// Import helper upload
const uploadOptions = require('../helpers/upload-helper'); 

// Các Route GET
router.get('/', productController.getProducts);
router.get('/by-ids', productController.getProductsByIds); 
router.get('/:id', productController.getProductById);

// ⭐️ ROUTE POST: Thêm 'uploadOptions.single' để xử lý ảnh
// 'image' ở đây là tên key mà Frontend gửi lên trong FormData
router.post('/', uploadOptions.single('image'), productController.createProduct);

// Các Route PUT/DELETE
router.put('/:id', productController.updateProduct);

router.delete('/:id', productController.deleteProduct);

router.put('/:id', uploadOptions.single('image'), productController.updateProduct);
module.exports = router;