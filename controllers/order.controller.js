const Order = require('../models/Order.model');
const Product = require('../models/Product.model'); 
const User = require('../models/User.model'); 
const { createNotification } = require('../helpers/notification-helper'); 

// Hàm tiện ích: Lấy ID người dùng
const getUserId = (req) => req.user?._id || req.user?.id;

// --- CONTROLLER FUNCTIONS ---

// 1. Lấy danh sách TẤT CẢ đơn hàng (Admin)
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

// 2. Lấy danh sách đơn hàng CỦA TÔI (User)
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

// 3. Tạo đơn hàng mới (TÍCH HỢP THÔNG BÁO)
const createOrder = async (req, res) => {
    console.log("DEBUG ORDER: Received new order request.");
    try {
        req.body.user = getUserId(req); 
        
        // Tạo đơn hàng mới
        const newOrder = await Order.create(req.body); 

        // --- LOGIC LẤY ẢNH SẢN PHẨM CHO THÔNG BÁO ---
        let imageUrl = null;
        const firstProductItem = newOrder.products[0];
        
        if (firstProductItem && firstProductItem.product) {
            try {
                // Lấy thông tin sản phẩm để lấy ảnh
                const productDetail = await Product.findById(firstProductItem.product).select('image').lean();
                // Lấy ảnh đầu tiên trong mảng ảnh
                if (productDetail && productDetail.image && productDetail.image.length > 0) {
                    imageUrl = Array.isArray(productDetail.image) ? productDetail.image[0] : productDetail.image;
                }
            } catch (imageError) {
                console.warn("WARNING: Could not fetch product image details.", imageError.message);
            }
        }
        
        const orderId = newOrder._id;
        const userId = getUserId(req); 
        const orderTotal = newOrder.total ? newOrder.total.toFixed(2) : '0.00'; 
        
        // --- TẠO THÔNG BÁO ---
        await createNotification({
            userId: userId,
            title: `Order #${orderId.toString().slice(-6)} confirmed!`,
            description: `Order valued at $${orderTotal} is being processed.`,
            type: 'ORDER_STATUS',
            referenceId: orderId,
            referenceModel: 'Order',
            image: imageUrl, 
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

// 4. Lấy chi tiết đơn hàng
const getOrderById = async (req, res) => {
    const orderId = req.params.id;
    const userId = getUserId(req);
    
    const isUserAdmin = req.user?.role === 'admin'; 
    let filter = { _id: orderId };
    
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

// 5. Cập nhật trạng thái đơn hàng (Admin)
const updateOrder = async (req, res) => {
    try {
        const order = await Order.findByIdAndUpdate(req.params.id, req.body, { new: true });
        
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found." });
        }
        
        res.json({ success: true, data: order });
    } catch (error) {
        res.status(400).json({ success: false, message: "Invalid update request." });
    }
};

// 6. Đếm số lượng đơn hàng của user
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

// 7. Lấy tổng số đơn hàng (Admin)
const getTotalOrders = async (req, res) => {
    try {
        const orderCount = await Order.countDocuments(); 
        res.status(200).json({ success: true, count: orderCount });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to count total orders." });
    }
};

// 8. Thống kê Dashboard (Admin)
const getDashboardStats = async (req, res) => {
    try {
        const [orderStats, userCount, productCount] = await Promise.all([
            Order.aggregate([
                {
                    $group: {
                        _id: null,
                        totalOrders: { $sum: 1 },
                        totalRevenue: { $sum: "$total" } 
                    }
                }
            ]),
            User.countDocuments(),
            Product.countDocuments()
        ]);

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

// 9. Thống kê doanh thu biểu đồ (Admin)
const getRevenueAnalytics = async (req, res) => {
    try {
        const { type } = req.query; 
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
                startDate.setMonth(0, 1);
                startDate.setHours(0, 0, 0, 0);
                groupBy = { $month: "$createdAt" };
                break;
            default:
                startDate.setMonth(0, 1);
                groupBy = { $month: "$createdAt" };
        }

        const stats = await Order.aggregate([
            { $match: { createdAt: { $gte: startDate } } },
            {
                $group: {
                    _id: groupBy, 
                    totalSales: { $sum: "$total" } 
                }
            },
            { $sort: { _id: 1 } } 
        ]);

        res.status(200).json({ success: true, data: stats });

    } catch (error) {
        
        res.status(500).json({ success: false, message: error.message });
    }
};

// 10. Thống kê số lượng đơn hàng theo thời gian (Admin)
const getOrderAnalytics = async (req, res) => {
    try {
        const { type } = req.query;
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
                startDate.setMonth(0, 1);
                startDate.setHours(0, 0, 0, 0);
                groupBy = { $month: "$createdAt" };
                break;
            default:
                startDate.setMonth(0, 1);
                groupBy = { $month: "$createdAt" };
        }

        const stats = await Order.aggregate([
            { $match: { createdAt: { $gte: startDate } } },
            {
                $group: {
                    _id: groupBy,
                    totalOrders: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.status(200).json({ success: true, data: stats });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


module.exports = {
    getOrders,          
    getOrdersByUser,    
    createOrder,
    getOrderById,
    updateOrder,
    getOrderCount,
    getTotalOrders,
    getRevenueAnalytics,
    getDashboardStats,
    getOrderAnalytics
};