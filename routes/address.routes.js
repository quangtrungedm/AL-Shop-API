const express = require('express');
const router = express.Router();
// Đảm bảo import này không bị lỗi path:
const addressController = require('../controllers/address.controller');
// Giả định bạn có middleware xác thực user:
const { isAuth } = require('../middleware/auth'); 

// TẤT CẢ routes đều yêu cầu xác thực (isAuth)
router.get('/', isAuth, addressController.getAddresses);        
router.post('/', isAuth, addressController.createAddress);       
router.put('/:id', isAuth, addressController.updateAddress);     
router.delete('/:id', isAuth, addressController.deleteAddress);  

module.exports = router;