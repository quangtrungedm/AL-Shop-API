// routes/products.js
const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const uploadOptions = require('../helpers/upload-helper'); 

// Các Route GET
router.get('/', productController.getProducts);
router.get('/by-ids', productController.getProductsByIds); 
router.get('/:id', productController.getProductById);

// Route POST
router.post('/', uploadOptions.single('image'), productController.createProduct);

// Route PUT Sửa Form
router.put('/:id', uploadOptions.single('image'), productController.updateProduct);

// ⭐️ ROUTE MỚI: Cập nhật trạng thái isActive (Thay thế cho DELETE) ⭐️
router.put('/:id/status', productController.toggleProductStatus); 

module.exports = router;