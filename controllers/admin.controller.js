// controllers/admin.controller.js

const User = require('../models/User.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// ⭐️ NEW FUNCTION: Admin Login ⭐️
const loginAdmin = async (req, res) => {
    // ⭐️ DEBUG 1: Receive input data ⭐️
    console.log('====================================================');
    console.log('🚀 [SERVER DEBUG] START Admin Login...');
    try {
        const { email, password } = req.body;
        console.log(`[SERVER DEBUG] Input: Email=${email}`);

        // 1. Find User
        const user = await User.findOne({ email });

        // ⭐️ DEBUG 2: Check if User exists ⭐️
        if (!user) {
            console.log(`❌ [SERVER DEBUG] ERROR 1: User NOT found with email: ${email}`);
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
        
        console.log(`✅ [SERVER DEBUG] User found (ID: ${user._id}). Role DB: ${user.role}`);

        // 2. Compare Password (MOST COMMON CAUSE)
        const isMatch = await bcrypt.compare(password, user.password);
        
        // ⭐️ DEBUG 3: Password comparison result ⭐️
        console.log(`🔑 [SERVER DEBUG] Does input password match (isMatch): ${isMatch}`);
        
        if (!isMatch) {
            console.log('❌ [SERVER DEBUG] ERROR 2: Password does not match.');
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // 3. CHECK ADMIN ROLE
        if (user.role !== 'admin') {
            console.log(`❌ [SERVER DEBUG] ERROR 3: Account does not have Admin role. Current role: ${user.role}`);
            return res.status(403).json({ success: false, message: 'You do not have administrative access.' });
        }
        
        // Success
        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
            expiresIn: '30d',
        });

        const userWithoutPassword = user.toObject();
        delete userWithoutPassword.password;
        
        console.log('🎉 [SERVER DEBUG] Admin Login successful!');
        console.log('====================================================');
        
        res.json({
            success: true,
            token,
            data: userWithoutPassword
        });
    } catch (error) {
        console.error("❌ [SERVER DEBUG] SERVER ERROR 500: Admin Login failed:", error);
        console.log('====================================================');
        // Return internal server error (careful not to expose error details externally)
        res.status(500).json({ success: false, message: 'Internal server error. Please check console.' });
    }
};

// Get user list (Admin Function)
const getUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json({ success: true, data: users });
    } catch (error) {
        console.error("ERROR: Admin getUsers failed:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get single user info (Admin Function)
const getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.json({ success: true, data: user });
    } catch (error) {
        console.error("ERROR: Admin getUserById failed:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// UPDATE FUNCTION updateUser (Admin Function)
const updateUser = async (req, res) => {
    try {
        const userId = req.params.id;
        // Admin can update all information, including Role
        const { name, email, phone, address, avatar, role } = req.body; 

        if (!name || !email) {
            return res.status(400).json({ success: false, message: 'Name and Email cannot be empty.' });
        }
        
        // Check if Admin is trying to downgrade their own account (Optional)
        if (req.user && req.user._id.toString() === userId && role === 'user') {
             return res.status(403).json({ success: false, message: 'Cannot downgrade active Admin account.' });
        }

        const updates = {};
        if (name) updates.name = name;
        if (email) updates.email = email;
        updates.phone = phone !== undefined ? phone : '';
        updates.address = address !== undefined ? address : '';
        updates.avatar = avatar !== undefined ? avatar : '';
        if (role) updates.role = role; // Allow Admin to edit role

        const user = await User.findByIdAndUpdate(
            userId,
            { $set: updates },
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ success: false, message: 'User to update not found.' });
        }

        res.status(200).json({
            success: true,
            message: 'User information updated successfully.',
            data: user
        });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'This email is already used by another user.' });
        }
        console.error("ERROR: Admin updateUser failed:", error);
        res.status(400).json({ success: false, message: error.message });
    }
};

// Delete user (Admin Function)
const deleteUser = async (req, res) => {
    try {
        const userId = req.params.id;
        
        // Check if Admin is deleting themselves
        if (req.user && req.user._id.toString() === userId) {
             return res.status(403).json({ success: false, message: 'Admin cannot delete their own account.' });
        }

        await User.findByIdAndDelete(userId);
        res.json({ success: true, message: 'User deleted' });
    } catch (error) {
        console.error("ERROR: Admin deleteUser failed:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    loginAdmin,
    getUsers,
    getUserById,
    updateUser,
    deleteUser,
};
