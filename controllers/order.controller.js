const Order = require('../models/Order.model');
const Product = require('../models/Product.model'); 
const User = require('../models/User.model'); 
const { createNotification } = require('../helpers/notification-helper'); 

// --- HELPERS (Utility Functions) ---

// Get User ID safely from request
const getUserId = (req) => req.user?._id || req.user?.id;

// Calculate date range for chart analytics
const getDateRangeAndGroupBy = (type) => {
    const today = new Date();
    let startDate = new Date();
    let groupBy = {};

    switch (type) {
        case 'day': 
            startDate.setHours(0, 0, 0, 0);
            groupBy = { $hour: "$createdAt" };
            break;
        case 'week': 
            startDate.setDate(today.getDate() - 6);
            startDate.setHours(0, 0, 0, 0);
            groupBy = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };
            break;
        case 'month': 
            startDate.setDate(1);
            startDate.setHours(0, 0, 0, 0);
            groupBy = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };
            break;
        case 'year': 
        default:
            startDate.setMonth(0, 1);
            startDate.setHours(0, 0, 0, 0);
            groupBy = { $month: "$createdAt" };
    }
    return { startDate, groupBy };
};

// Function to get the thumbnail image URL for an order
const getOrderImage = async (orderProducts) => {
    if (orderProducts && orderProducts.length > 0) {
        const firstProductItem = orderProducts[0];
        const productId = firstProductItem.product._id || firstProductItem.product; 
        
        try {
            const product = await Product.findById(productId).select('image').lean();
            if (product && product.image && product.image.length > 0) {
                return Array.isArray(product.image) ? product.image[0] : product.image;
            }
        } catch (e) {
            return null;
        }
    }
    return null;
};

// ==========================================
// 1. ORDER MANAGEMENT FUNCTIONS (CRUD)
// ==========================================

// Get all orders (Admin)
const getOrders = async (req, res) => {
    try {
        const orders = await Order.find()
            .populate('user', 'name email')
            .populate({
                path: 'products.product',
                select: 'name price image category',
                populate: { path: 'category', select: 'name' }
            })
            .sort({ createdAt: -1 })
            .lean();

        res.status(200).json({ success: true, data: orders });
    } catch (error) {
        console.error("Error getOrders:", error);
        res.status(500).json({ success: false, message: "Error fetching order list." });
    }
};

// Get orders by current user
const getOrdersByUser = async (req, res) => {
    try {
        const userId = getUserId(req);
        const orders = await Order.find({ user: userId })
            .populate('products.product', 'name price image')
            .sort({ createdAt: -1 })
            .lean();

        res.status(200).json({ success: true, data: orders });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error fetching your orders." });
    }
};

// Get 1 order detail
const getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('user', 'name email')
            .populate('products.product', 'name price image')
            .populate('shippingAddress')
            .lean();

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found.' });
        }
        res.status(200).json({ success: true, data: order });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error fetching order details." });
    }
};

// --- CREATE NEW ORDER ---
const createOrder = async (req, res) => {
    try {
        const userId = getUserId(req);
        
        // 1. Save the order
        const newOrder = await Order.create({
            ...req.body,
            user: userId,
        });

        // 2. Get thumbnail image (Non-blocking)
        const imageUrl = await getOrderImage(newOrder.products);
        const formattedTotal = newOrder.total?.toLocaleString('en-US', {style:'currency', currency:'USD'});

        // 3. Send Notifications
        
        // A. Notify CUSTOMER
        createNotification({
            userId: userId,
            // ⭐️ TRANSLATED: Order placed successfully!
            title: `Order placed successfully! #${newOrder._id.toString().slice(-6).toUpperCase()}`,
            description: `Total: ${formattedTotal}. Your order is being processed.`,
            type: 'ORDER_STATUS',
            referenceId: newOrder._id,
            image: imageUrl, 
        }).catch(console.error);

        // B. Notify ADMINS
        const adminsToNotify = await User.find({ role: 'admin' }).select('_id');

        if (adminsToNotify.length > 0) {
            adminsToNotify.forEach(admin => {
                createNotification({
                    userId: admin._id,
                    // ⭐️ TRANSLATED: New order received
                    title: `📦 New Order Received: #${newOrder._id.toString().slice(-6).toUpperCase()}`,
                    description: `Customer placed order worth ${formattedTotal}.`,
                    type: 'NEW_ORDER',
                    referenceId: newOrder._id,
                    image: imageUrl
                }).catch(console.error);
            });
        }

        res.status(201).json({ success: true, data: newOrder, message: "Order placed successfully!" });

    } catch (error) {
        console.error("Create Order Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// --- UPDATE ORDER STATUS ---
const updateOrder = async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
        
        if (status && !validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid status." });
        }

        // Update DB
        const order = await Order.findByIdAndUpdate(
            req.params.id, 
            { status: status }, 
            { new: true }
        ).populate('user', 'name'); 

        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found." });
        }

        // --- NOTIFICATION LOGIC ---
        if (status) {
            const imageUrl = await getOrderImage(order.products);
            const orderCode = order._id.toString().slice(-6).toUpperCase();
            
            let userTitle = `Order Update #${orderCode}`;
            let userDesc = `Your order status changed to: ${status.toUpperCase()}`;
            
            // Customize message
            if (status === 'shipped') {
                userDesc = "Your order is currently out for delivery 🚚";
            } else if (status === 'delivered') {
                userTitle = "Delivery successful! 🎉";
                userDesc = "You have received your order. Please review your products!";
            } else if (status === 'cancelled') {
                userTitle = "Order Cancelled ❌";
                userDesc = "We regret to inform you that your order has been cancelled.";
            }

            // 1. Notify User
            createNotification({
                userId: order.user._id,
                title: userTitle,
                description: userDesc,
                type: 'ORDER_STATUS',
                referenceId: order._id,
                image: imageUrl
            }).catch(console.error);

            // 2. Notify Admin (Only for delivered/cancelled)
            if (status === 'delivered' || status === 'cancelled') {
                const adminsToNotify = await User.find({ role: 'admin' }).select('_id');
                adminsToNotify.forEach(admin => {
                    createNotification({
                        userId: admin._id,
                        title: `🔔 Status Change: #${orderCode} - ${status.toUpperCase()}`,
                        description: `Order from ${order.user.name} is now ${status}.`,
                        type: 'ORDER_UPDATE',
                        referenceId: order._id
                    });
                });
            }
        }

        res.status(200).json({ success: true, data: order, message: "Status updated successfully." });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ==========================================
// 2. ANALYTICS FUNCTIONS
// ==========================================

const getDashboardStats = async (req, res) => {
    try {
        const [orderStats, userCount, productCount] = await Promise.all([
            Order.aggregate([
                { $group: { _id: null, totalOrders: { $sum: 1 }, totalRevenue: { $sum: "$total" } } }
            ]),
            User.countDocuments(),
            Product.countDocuments()
        ]);

        const stats = orderStats[0] || { totalOrders: 0, totalRevenue: 0 };

        res.status(200).json({ 
            success: true, 
            data: { orders: stats.totalOrders, revenue: stats.totalRevenue, users: userCount, products: productCount }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error fetching dashboard statistics." });
    }
};

const getRevenueAnalytics = async (req, res) => {
    try {
        const { type } = req.query;
        const { startDate, groupBy } = getDateRangeAndGroupBy(type);

        const stats = await Order.aggregate([
            { $match: { createdAt: { $gte: startDate } } },
            { $group: { _id: groupBy, totalSales: { $sum: "$total" } } },
            { $sort: { _id: 1 } } 
        ]);

        res.status(200).json({ success: true, data: stats });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getOrderVolumeAnalytics = async (req, res) => {
    try {
        const { type } = req.query;
        const { startDate, groupBy } = getDateRangeAndGroupBy(type);

        const stats = await Order.aggregate([
            { $match: { createdAt: { $gte: startDate } } },
            { $group: { _id: groupBy, totalOrders: { $sum: 1 } } },
            { $sort: { _id: 1 } }
        ]);

        res.status(200).json({ success: true, data: stats });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getTotalOrders = async (req, res) => {
    try {
        const count = await Order.countDocuments();
        res.status(200).json({ success: true, count });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getOrderCount = async (req, res) => {
    const userId = getUserId(req);
    try {
        const count = await Order.countDocuments({ user: userId });
        res.json({ success: true, count });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getOrders,
    getOrdersByUser,
    getOrderById,
    createOrder,
    updateOrder,
    getDashboardStats,
    getRevenueAnalytics,
    getOrderVolumeAnalytics,
    getTotalOrders,
    getOrderCount
};