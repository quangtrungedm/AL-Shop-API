const Order = require('../models/Order.model');
const Product = require('../models/Product.model'); 
const User = require('../models/User.model'); 
const { createNotification } = require('../helpers/notification-helper'); 

// --- HELPERS (Hàm hỗ trợ) ---

// Lấy ID người dùng an toàn từ request
const getUserId = (req) => req.user?._id || req.user?.id;

// Tính toán thời gian cho biểu đồ thống kê
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

// Hàm lấy ảnh đại diện của đơn hàng (ảnh sản phẩm đầu tiên)
const getOrderImage = async (orderProducts) => {
    if (orderProducts && orderProducts.length > 0) {
        const firstProductItem = orderProducts[0];
        // Nếu product là ID
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
// 1. CÁC HÀM QUẢN LÝ ĐƠN HÀNG (CRUD)
// ==========================================

// Lấy toàn bộ đơn hàng (Cho Admin)
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
        res.status(500).json({ success: false, message: "Lỗi lấy danh sách đơn hàng." });
    }
};

// Lấy đơn hàng của người dùng hiện tại
const getOrdersByUser = async (req, res) => {
    try {
        const userId = getUserId(req);
        const orders = await Order.find({ user: userId })
            .populate('products.product', 'name price image')
            .sort({ createdAt: -1 })
            .lean();

        res.status(200).json({ success: true, data: orders });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi lấy đơn hàng của bạn." });
    }
};

// Lấy chi tiết 1 đơn hàng
const getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('user', 'name email')
            .populate('products.product', 'name price image')
            .populate('shippingAddress')
            .lean();

        if (!order) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng.' });
        }
        res.status(200).json({ success: true, data: order });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi lấy chi tiết đơn hàng." });
    }
};

// --- TẠO ĐƠN HÀNG MỚI ---
const createOrder = async (req, res) => {
    try {
        const userId = getUserId(req);
        
        // 1. Lưu đơn hàng
        const newOrder = await Order.create({
            ...req.body,
            user: userId,
        });

        // 2. Lấy ảnh thumbnail (Non-blocking)
        const imageUrl = await getOrderImage(newOrder.products);

        // 3. Gửi Thông báo (Logic Mới)
        
        // A. Báo cho KHÁCH HÀNG
        createNotification({
            userId: userId,
            title: `Đặt hàng thành công! #${newOrder._id.toString().slice(-6)}`,
            description: `Tổng tiền: ${newOrder.total?.toLocaleString('en-US', {style:'currency', currency:'USD'})}. Chúng tôi đang xử lý đơn hàng.`,
            type: 'ORDER_STATUS',
            referenceId: newOrder._id,
            image: imageUrl, 
        }).catch(console.error);

        // B. Báo cho ADMIN (Chỉ gửi cho ai ĐANG BẬT Push Notification)
        const adminsToNotify = await User.find({ 
            role: 'admin', 
            'settings.pushNotifications': true 
        }).select('_id');

        if (adminsToNotify.length > 0) {
            adminsToNotify.forEach(admin => {
                createNotification({
                    userId: admin._id,
                    title: `📦 Đơn hàng mới: #${newOrder._id.toString().slice(-6)}`,
                    description: `Khách hàng vừa đặt đơn trị giá ${newOrder.total?.toLocaleString('en-US', {style:'currency', currency:'USD'})}.`,
                    type: 'NEW_ORDER',
                    referenceId: newOrder._id,
                    image: imageUrl
                });
            });
        }

        res.status(201).json({ success: true, data: newOrder, message: "Order placed successfully!" });

    } catch (error) {
        console.error("Create Order Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// --- CẬP NHẬT TRẠNG THÁI ĐƠN HÀNG ---
// (Bao gồm logic "Nhận được hàng" -> Delivered)
const updateOrder = async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
        
        if (status && !validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: "Trạng thái không hợp lệ." });
        }

        // Cập nhật DB
        const order = await Order.findByIdAndUpdate(
            req.params.id, 
            { status: status }, 
            { new: true }
        ).populate('user', 'name'); // Populate user để lấy tên hiển thị trong log nếu cần

        if (!order) {
            return res.status(404).json({ success: false, message: "Đơn hàng không tồn tại." });
        }

        // --- LOGIC THÔNG BÁO THEO TRẠNG THÁI ---
        if (status) {
            const imageUrl = await getOrderImage(order.products);
            const orderCode = order._id.toString().slice(-6).toUpperCase();
            
            let userTitle = `Cập nhật đơn hàng #${orderCode}`;
            let userDesc = `Trạng thái đơn hàng của bạn đã chuyển sang: ${status.toUpperCase()}`;
            
            // Tùy chỉnh thông điệp cho hay hơn
            if (status === 'shipped') {
                userDesc = "Đơn hàng của bạn đang trên đường vận chuyển 🚚";
            } else if (status === 'delivered') {
                userTitle = "Giao hàng thành công! 🎉";
                userDesc = "Bạn đã nhận được hàng. Hãy đánh giá sản phẩm để nhận xu nhé!";
            } else if (status === 'cancelled') {
                userTitle = "Đơn hàng đã bị hủy ❌";
                userDesc = "Rất tiếc, đơn hàng của bạn đã bị hủy. Vui lòng liên hệ CSKH nếu cần hỗ trợ.";
            }

            // 1. Gửi cho User
            createNotification({
                userId: order.user._id,
                title: userTitle,
                description: userDesc,
                type: 'ORDER_STATUS',
                referenceId: order._id,
                image: imageUrl
            }).catch(console.error);

            // 2. Gửi cho Admin (Chỉ khi Hoàn thành hoặc Hủy để Admin nắm tình hình)
            if (status === 'delivered' || status === 'cancelled') {
                const adminsToNotify = await User.find({ role: 'admin', 'settings.pushNotifications': true }).select('_id');
                adminsToNotify.forEach(admin => {
                    createNotification({
                        userId: admin._id,
                        title: `🔔 Cập nhật: #${orderCode} - ${status.toUpperCase()}`,
                        description: `Đơn của ${order.user.name} đã chuyển sang trạng thái ${status}.`,
                        type: 'ORDER_UPDATE',
                        referenceId: order._id
                    });
                });
            }
        }

        res.status(200).json({ success: true, data: order, message: "Cập nhật trạng thái thành công." });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ==========================================
// 2. CÁC HÀM THỐNG KÊ (ANALYTICS)
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
        res.status(500).json({ success: false, message: "Lỗi thống kê." });
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