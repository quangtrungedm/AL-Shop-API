const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');

// http://localhost:5000/api/users/register
router.post('/register', userController.register);
// http://localhost:5000/api/users
router.get('/', userController.getUsers);
// http://localhost:5000/api/users/
router.post('/', userController.createUser);
router.get('/:id', userController.getUserById);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);
router.post('/forgot-password', userController.forgotPassword);
router.post('/verify-otp', userController.verifyOtp);
router.post('/set-new-password', userController.setNewPassword);

module.exports = router;
