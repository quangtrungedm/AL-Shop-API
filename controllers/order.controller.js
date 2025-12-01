// [File] controllers/order.controller.js

const Order = require('../models/Order.model');
const Product = require('../models/Product.model'); 
<<<<<<< HEAD
// ✅ FIX: Import User model for dashboard statistics
const User = require('../models/User.model'); 
const { createNotification } = require('../helpers/notification-helper'); 

// Helper: Extract User ID from request (handles both req.user._id and req.user.id)
=======
const User = require('../models/User.model'); // Đã import User để đếm thống kê
const { createNotification } = require('../helpers/notification-helper'); 

// Hàm tiện ích: Lấy ID người dùng
>>>>>>> vinh2
const getUserId = (req) => req.user?._id || req.user?.id;

// --- CONTROLLER FUNCTIONS ---

<<<<<<< HEAD
// ⭐️ Function 1: Retrieve ALL orders (Admin)
=======
// 1. Lấy danh sách TẤT CẢ đơn hàng (Admin)
>>>>>>> vinh2
const getOrders = async (req, res) => {
    console.log("DEBUG ORDER: Getting all orders (Admin).");
    try {
        const orders = await Order.find()
            .populate('user', 'name email')
            .populate('products.product', 'name price image')
            .populate('shippingAddress')
            .sort({ createdAt: -1 }); 
        res.json({ success: true, data: orders });
    } catch (error) {
        console.error("ERROR GET_ORDERS:", error.message);
        res.status(500).json({ success: false, message: "Failed to retrieve orders." });
    }
};

<<<<<<< HEAD
// ⭐️ Function 2: Retrieve orders for a specific User (Frontend)
=======
// 2. Lấy danh sách đơn hàng CỦA TÔI (User)
>>>>>>> vinh2
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

<<<<<<< HEAD
// ⭐️ Function 3: Create a new order
=======
// 3. Tạo đơn hàng mới (TÍCH HỢP TẠO THÔNG BÁO)
>>>>>>> vinh2
const createOrder = async (req, res) => {
    console.log("DEBUG ORDER: Received new order request.");
    try {
        req.body.user = getUserId(req); 
        
        // Create new order
        const newOrder = await Order.create(req.body); 

<<<<<<< HEAD
        // Logic: Fetch the first product image for the notification
=======
        // --- LOGIC LẤY ẢNH SẢN PHẨM CHO THÔNG BÁO ---
>>>>>>> vinh2
        let imageUrl = null;
        const firstProductItem = newOrder.products[0];
        
        if (firstProductItem && firstProductItem.product) {
            try {
<<<<<<< HEAD
                // Use .lean() for query optimization
=======
                // Lấy thông tin sản phẩm để lấy ảnh
>>>>>>> vinh2
                const productDetail = await Product.findById(firstProductItem.product).select('image').lean();
                // Lấy ảnh đầu tiên trong mảng ảnh
                if (productDetail && productDetail.image && productDetail.image.length > 0) {
                    // Kiểm tra nếu là mảng thì lấy phần tử đầu, nếu là string thì lấy chính nó
                    imageUrl = Array.isArray(productDetail.image) ? productDetail.image[0] : productDetail.image;
                }
            } catch (imageError) {
                console.warn("WARNING: Could not fetch product image details.", imageError.message);
            }
        }
        
        const orderId = newOrder._id;
        const userId = getUserId(req); 
<<<<<<< HEAD
        // Format total value from the created order
        const orderTotal = newOrder.total ? newOrder.total.toFixed(2) : '0.00'; 
        
        // Trigger notification
=======
        const orderTotal = newOrder.total ? newOrder.total.toFixed(2) : '0.00'; 
        
        // --- TẠO THÔNG BÁO ---
>>>>>>> vinh2
        await createNotification({
            userId: userId,
            title: `Order #${orderId.toString().slice(-6)} confirmed!`,
            description: `Order valued at $${orderTotal} is being processed.`,
            type: 'ORDER_STATUS',
            referenceId: orderId,
            referenceModel: 'Order',
            image: imageUrl, // Lưu URL ảnh vào thông báo
        });

        res.status(201).json({ 
            success: true, 
            data: newOrder, 
            message: "Order placed successfully."
        });
    } catch (error) {
        console.error("ERROR CREATE_ORDER:", error.message);
        const statusCode = error.name === 'ValidationError' ? 400 : 500;
        res.status(statusCode).json({ success: false, message: error.message });
    }
};

<<<<<<< HEAD
// ⭐️ Function 4: Retrieve order details by ID
=======
// 4. Lấy thông tin 1 đơn hàng
>>>>>>> vinh2
const getOrderById = async (req, res) => {
    const orderId = req.params.id;
    const userId = getUserId(req);
    
    const isUserAdmin = req.user?.role === 'admin'; 
    let filter = { _id: orderId };
    
<<<<<<< HEAD
    // If not admin, restrict query to the specific user owner
=======
>>>>>>> vinh2
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
        if (error.name === 'CastError') {
             return res.status(400).json({ success: false, message: "Invalid Order ID." });
        }
        res.status(500).json({ success: false, message: "Failed to retrieve order details." });
    }
};

<<<<<<< HEAD
// ⭐️ Function 5: Update order status (Admin)
=======
// 5. Cập nhật trạng thái đơn hàng (Admin)
>>>>>>> vinh2
const updateOrder = async (req, res) => {
    try {
        const order = await Order.findByIdAndUpdate(req.params.id, req.body, { new: true });
        
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found." });
        }
        
        // (Tùy chọn) Có thể thêm createNotification ở đây để báo cho user biết đơn hàng đã thay đổi trạng thái
        
        res.json({ success: true, data: order });
    } catch (error) {
        res.status(400).json({ success: false, message: "Invalid update request." });
    }
};

<<<<<<< HEAD
// ⭐️ Function 6: Count orders for the current user (User App)
=======
// 6. Đếm số lượng đơn hàng của user
>>>>>>> vinh2
const getOrderCount = async (req, res) => {
    const userId = getUserId(req); 
    if (!userId) return res.status(401).json({ success: false, message: "Authentication required." });

    try {
        const count = await Order.countDocuments({ user: userId });
        res.json({ success: true, count: count });
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal server error." });
    }
};

<<<<<<< HEAD
// ⭐️ Function 7: Get total order count (Simple - Admin)
=======
// 7. Lấy tổng số đơn hàng (Admin)
>>>>>>> vinh2
const getTotalOrders = async (req, res) => {
    try {
        const orderCount = await Order.countDocuments(); 
        res.status(200).json({ success: true, count: orderCount });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to count total orders." });
    }
};

<<<<<<< HEAD
// ⭐️ Function 8 (FINAL): Retrieve Dashboard Stats (Orders, Revenue, Users, Products)
=======
// 8. Lấy thống kê Dashboard (Admin)
>>>>>>> vinh2
const getDashboardStats = async (req, res) => {
    try {
<<<<<<< HEAD
        // Use Promise.all for parallel execution
        const [orderStats, userCount, productCount] = await Promise.all([
            // 1. Calculate Total Orders and Revenue
=======
        const [orderStats, userCount, productCount] = await Promise.all([
>>>>>>> vinh2
            Order.aggregate([
                {
                    $group: {
                        _id: null,
                        totalOrders: { $sum: 1 },
<<<<<<< HEAD
                        // ✅ IMPORTANT: Use "$total" matching the Model schema
=======
>>>>>>> vinh2
                        totalRevenue: { $sum: "$total" } 
                    }
                }
            ]),
<<<<<<< HEAD
            // 2. Count Total Users
            User.countDocuments(),
            // 3. Count Total Products
            Product.countDocuments()
        ]);

        // Process aggregation results
=======
            User.countDocuments(),
            Product.countDocuments()
        ]);

>>>>>>> vinh2
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
        res.status(500).json({ success: false, message: "Failed to get dashboard stats." });
    }
};

<<<<<<< HEAD
// ⭐️ Function 9 (FINAL): Revenue Analytics for Charts
=======
// 9. Thống kê doanh thu biểu đồ (Admin)
>>>>>>> vinh2
const getRevenueAnalytics = async (req, res) => {
    try {
        const { type } = req.query; 
        const today = new Date();
        let startDate = new Date();
        let groupBy = {};
        
<<<<<<< HEAD
        // 1. Determine time range and grouping strategy
        switch (type) {
            case 'day': // Group by hour for today
                startDate.setHours(0, 0, 0, 0);
                groupBy = { $hour: "$createdAt" };
                break;
            case 'week': // Last 7 days
=======
        switch (type) {
            case 'day':
                startDate.setHours(0, 0, 0, 0);
                groupBy = { $hour: "$createdAt" };
                break;
            case 'week':
>>>>>>> vinh2
                startDate.setDate(today.getDate() - 6);
                startDate.setHours(0, 0, 0, 0);
                groupBy = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };
                break;
<<<<<<< HEAD
            case 'month': // All days in current month
                startDate.setDate(1); // 1st day of month
=======
            case 'month':
                startDate.setDate(1);
>>>>>>> vinh2
                startDate.setHours(0, 0, 0, 0);
                groupBy = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };
                break;
<<<<<<< HEAD
            case 'year': // 12 months in current year
                startDate.setMonth(0, 1); // January 1st
                startDate.setHours(0, 0, 0, 0);
                groupBy = { $month: "$createdAt" };
                break;
            default: // Default to Year
=======
            case 'year':
                startDate.setMonth(0, 1);
                startDate.setHours(0, 0, 0, 0);
                groupBy = { $month: "$createdAt" };
                break;
            default:
>>>>>>> vinh2
                startDate.setMonth(0, 1);
                groupBy = { $month: "$createdAt" };
        }

<<<<<<< HEAD
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
=======
        const stats = await Order.aggregate([
            { $match: { createdAt: { $gte: startDate } } },
            {
                $group: {
                    _id: groupBy, 
                    totalSales: { $sum: "$total" } 
                }
            },
            { $sort: { _id: 1 } } 
>>>>>>> vinh2
        ]);

        res.status(200).json({ success: true, data: stats });

    } catch (error) {
<<<<<<< HEAD
        console.error("Chart API Error:", error);
=======
>>>>>>> vinh2
        res.status(500).json({ success: false, message: error.message });
    }
};

<<<<<<< HEAD
// ⭐️ Export all functions ⭐️
=======
>>>>>>> vinh2
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
