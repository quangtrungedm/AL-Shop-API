// File: controllers/order.controller.js

const Order = require('../models/Order.model');
const Product = require('../models/Product.model'); 
// ✅ FIX: Import User model for dashboard statistics
const User = require('../models/User.model'); 
const { createNotification } = require('../helpers/notification-helper'); 

// Helper: Extract User ID from request (handles both req.user._id and req.user.id)
const getUserId = (req) => req.user?._id || req.user?.id;

// --- CONTROLLER FUNCTIONS ---

// ⭐️ Function 1: Retrieve ALL orders (Admin)
const getOrders = async (req, res) => {
    console.log("DEBUG ORDER: Getting all orders (Admin).");
    try {
        const orders = await Order.find()
            .populate('user', 'name email')
            .populate('products.product', 'name price image')
            .populate('shippingAddress'); 
        res.json({ success: true, data: orders });
    } catch (error) {
        console.error("ERROR GET_ORDERS:", error.message);
        res.status(500).json({ success: false, message: "Failed to retrieve orders." });
    }
};

// ⭐️ Function 2: Retrieve orders for a specific User (Frontend)
const getOrdersByUser = async (req, res) => {
    const userId = getUserId(req); 
    console.log(`DEBUG ORDER: Getting orders for User ID: ${userId}`);

    try {
        const orders = await Order.find({ user: userId }) 
            .sort({ orderDate: -1 }) 
            .populate('products.product', 'name price image')
            .populate('shippingAddress'); 
            
        res.status(200).json({ success: true, data: orders });
    } catch (error) {
        console.error("ERROR GET_ORDERS_BY_USER:", error.message);
        res.status(500).json({ success: false, message: "Failed to retrieve user's orders." });
    }
};

// ⭐️ Function 3: Create a new order
const createOrder = async (req, res) => {
    console.log("DEBUG ORDER: Received new order request.");
    try {
        req.body.user = getUserId(req); 
        
        // Create new order
        const newOrder = await Order.create(req.body); 

        // Logic: Fetch the first product image for the notification
        let imageUrl = null;
        const firstProductItem = newOrder.products[0];
        
        if (firstProductItem && firstProductItem.product) {
            try {
                // Use .lean() for query optimization
                const productDetail = await Product.findById(firstProductItem.product).select('image').lean();
                if (productDetail && productDetail.image && productDetail.image.length > 0) {
                    imageUrl = productDetail.image[0]; 
                }
            } catch (imageError) {
                console.warn("WARNING: Could not fetch product image details.", imageError.message);
            }
        }
        
        const orderId = newOrder._id;
        const userId = getUserId(req); 
        // Format total value from the created order
        const orderTotal = newOrder.total ? newOrder.total.toFixed(2) : '0.00'; 
        
        // Trigger notification
        await createNotification({
            userId: userId,
            title: `Order #${orderId.toString().slice(-6)} has been confirmed!`,
            description: `Your order valued at $${orderTotal} has been received and is processing.`,
            type: 'ORDER_STATUS',
            referenceId: orderId,
            image: imageUrl, 
        });

        res.status(201).json({ 
            success: true, 
            data: newOrder, 
            message: "Order placed successfully. History recorded."
        });
    } catch (error) {
        console.error("ERROR CREATE_ORDER - Detail:", error.message);
        const statusCode = error.name === 'ValidationError' ? 400 : 500;
        res.status(statusCode).json({ success: false, message: error.message });
    }
};

// ⭐️ Function 4: Retrieve order details by ID
const getOrderById = async (req, res) => {
    const orderId = req.params.id;
    const userId = getUserId(req);
    console.log(`DEBUG ORDER: Getting order by ID: ${orderId}. Checking user: ${userId}`);
    
    const isUserAdmin = req.user?.role === 'admin'; 
    let filter = { _id: orderId };
    
    // If not admin, restrict query to the specific user owner
    if (!isUserAdmin) {
        filter.user = userId; 
    }

    try {
        const order = await Order.findOne(filter)
            .populate('user', 'name email')
            .populate('products.product', 'name price image')
            .populate('shippingAddress'); 
            
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found or access denied.' });
        }
        res.json({ success: true, data: order });
    } catch (error) {
        console.error("ERROR GET_ORDER_BY_ID:", error.message);
        if (error.name === 'CastError') {
             return res.status(400).json({ success: false, message: "Invalid Order ID format." });
        }
        res.status(500).json({ success: false, message: "Failed to retrieve order details." });
    }
};

// ⭐️ Function 5: Update order status (Admin)
const updateOrder = async (req, res) => {
    console.log(`DEBUG ORDER: Updating order ID: ${req.params.id}`);
    try {
        const order = await Order.findByIdAndUpdate(req.params.id, req.body, { new: true });
        
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found." });
        }
        
        res.json({ success: true, data: order });
    } catch (error) {
        console.error("ERROR UPDATE_ORDER:", error.message);
        res.status(400).json({ success: false, message: "Invalid update request or data." });
    }
};

// ⭐️ Function 6: Count orders for the current user (User App)
const getOrderCount = async (req, res) => {
    const userId = getUserId(req); 

    console.log(`DEBUG COUNT: Attempting to count orders for ID: ${userId}`);

    if (!userId) {
        return res.status(401).json({ success: false, message: "Authentication required." });
    }

    try {
        const count = await Order.countDocuments({ user: userId });
        res.json({ success: true, count: count });
    } catch (error) {
        console.error("CRITICAL ERROR in getOrderCount:", error); 
        res.status(500).json({ success: false, message: "Internal server error while counting orders." });
    }
};

// ⭐️ Function 7: Get total order count (Simple - Admin)
const getTotalOrders = async (req, res) => {
    console.log("DEBUG DASHBOARD: Getting total orders count for Admin.");
    try {
        const orderCount = await Order.countDocuments(); 
        res.status(200).json({ success: true, count: orderCount });
    } catch (error) {
        console.error("ERROR GET_TOTAL_ORDERS:", error.message);
        res.status(500).json({ success: false, message: "Failed to count total orders." });
    }
};

// ⭐️ Function 8 (FINAL): Retrieve Dashboard Stats (Orders, Revenue, Users, Products)
const getDashboardStats = async (req, res) => {
    console.log("DEBUG DASHBOARD: Fetching all stats...");
    try {
        // Use Promise.all for parallel execution
        const [orderStats, userCount, productCount] = await Promise.all([
            // 1. Calculate Total Orders and Revenue
            Order.aggregate([
                {
                    $group: {
                        _id: null,
                        totalOrders: { $sum: 1 },
                        // ✅ IMPORTANT: Use "$total" matching the Model schema
                        totalRevenue: { $sum: "$total" } 
                    }
                }
            ]),
            // 2. Count Total Users
            User.countDocuments(),
            // 3. Count Total Products
            Product.countDocuments()
        ]);

        // Process aggregation results
        const resultOrder = orderStats.length > 0 ? orderStats[0] : { totalOrders: 0, totalRevenue: 0 };

        res.status(200).json({ 
            success: true, 
            data: {
                orders: resultOrder.totalOrders,
                revenue: resultOrder.totalRevenue,
                users: userCount,
                products: productCount
            }
        });
    } catch (error) {
        console.error("ERROR DASHBOARD STATS:", error);
        res.status(500).json({ success: false, message: "Failed to get dashboard stats." });
    }
};

// ⭐️ Function 9 (FINAL): Revenue Analytics for Charts
const getRevenueAnalytics = async (req, res) => {
    try {
        const { type } = req.query; // type = 'day', 'week', 'month', 'year'
        const today = new Date();
        let startDate = new Date();
        let groupBy = {};
        
        // 1. Determine time range and grouping strategy
        switch (type) {
            case 'day': // Group by hour for today
                startDate.setHours(0, 0, 0, 0);
                groupBy = { $hour: "$createdAt" };
                break;
            case 'week': // Last 7 days
                startDate.setDate(today.getDate() - 6);
                startDate.setHours(0, 0, 0, 0);
                groupBy = { 
                    $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } 
                };
                break;
            case 'month': // All days in current month
                startDate.setDate(1); // 1st day of month
                startDate.setHours(0, 0, 0, 0);
                groupBy = { 
                    $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } 
                };
                break;
            case 'year': // 12 months in current year
                startDate.setMonth(0, 1); // January 1st
                startDate.setHours(0, 0, 0, 0);
                groupBy = { $month: "$createdAt" };
                break;
            default: // Default to Year
                startDate.setMonth(0, 1);
                groupBy = { $month: "$createdAt" };
        }

        // 2. Execute Aggregation (Group and Sum)
        const stats = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate }, // Filter from start date
                    // status: { $ne: 'cancelled' } // (Optional) Exclude cancelled orders
                }
            },
            {
                $group: {
                    _id: groupBy, // Group by Day/Month/Hour
                    totalSales: { $sum: "$total" } // Sum revenue (Ensure DB field is 'total')
                }
            },
            { $sort: { _id: 1 } } // Sort ascending by time
        ]);

        res.status(200).json({ success: true, data: stats });

    } catch (error) {
        console.error("Chart API Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ⭐️ Export all functions ⭐️
module.exports = {
    getOrders,           
    getOrdersByUser,     
    createOrder,
    getOrderById,
    updateOrder,
    getOrderCount,
    getTotalOrders,
    getRevenueAnalytics,
    getDashboardStats
};
