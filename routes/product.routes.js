const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');

router.get('/', productController.getProducts);

// ROUTE MỚI (PHẢI NẰM TRƯỚC /:id)
router.get('/by-ids', productController.getProductsByIds); 

router.post('/', productController.createProduct);
router.get('/:id', productController.getProductById);
router.put('/:id', productController.updateProduct);
router.delete('/:id', productController.deleteProduct);

module.exports = router;