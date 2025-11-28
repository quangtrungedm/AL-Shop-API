// File: controllers/order.controller.js

const Order = require('../models/Order.model');
const Product = require('../models/Product.model'); 
// ✅ FIX LỖI: Import User model để dùng cho hàm đếm thống kê
const User = require('../models/User.model'); 
const { createNotification } = require('../helpers/notification-helper'); 

// Hàm tiện ích: Lấy ID người dùng (xử lý cả req.user._id và req.user.id)
const getUserId = (req) => req.user?._id || req.user?.id;

// --- ĐỊNH NGHĨA CÁC HÀM CONTROLLER ---

// ⭐️ Hàm 1: Lấy danh sách TẤT CẢ đơn hàng (Admin)
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

// ⭐️ Hàm 2: Lấy danh sách đơn hàng CỦA MỘT NGƯỜI DÙNG (Frontend)
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

// ⭐️ Hàm 3: Tạo đơn hàng mới
const createOrder = async (req, res) => {
    console.log("DEBUG ORDER: Received new order request.");
    try {
        req.body.user = getUserId(req); 
        
        // Tạo đơn hàng mới
        const newOrder = await Order.create(req.body); 

        // Xử lý lấy ảnh sản phẩm đầu tiên để làm thông báo
        let imageUrl = null;
        const firstProductItem = newOrder.products[0];
        
        if (firstProductItem && firstProductItem.product) {
            try {
                // Sử dụng .lean() để tối ưu truy vấn
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
        // Lấy giá trị total từ đơn hàng vừa tạo
        const orderTotal = newOrder.total ? newOrder.total.toFixed(2) : '0.00'; 
        
        // Tạo thông báo
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

// ⭐️ Hàm 4: Lấy thông tin 1 đơn hàng
const getOrderById = async (req, res) => {
    const orderId = req.params.id;
    const userId = getUserId(req);
    console.log(`DEBUG ORDER: Getting order by ID: ${orderId}. Checking user: ${userId}`);
    
    const isUserAdmin = req.user?.role === 'admin'; 
    let filter = { _id: orderId };
    
    // Nếu không phải admin, thêm điều kiện lọc theo user ID
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

// ⭐️ Hàm 5: Cập nhật trạng thái đơn hàng (Admin)
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

// ⭐️ Hàm 6: Đếm số lượng đơn hàng của người dùng (Cho User App)
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

// ⭐️ Hàm 7: Lấy tổng số đơn hàng (Đơn giản)
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

// ⭐️ Hàm 8 (FINAL): Lấy thống kê chi tiết cho Dashboard (Orders, Revenue, Users, Products)
const getDashboardStats = async (req, res) => {
    console.log("DEBUG DASHBOARD: Fetching all stats...");
    try {
        // Sử dụng Promise.all để chạy song song 3 truy vấn
        const [orderStats, userCount, productCount] = await Promise.all([
            // 1. Tính tổng đơn hàng và doanh thu
            Order.aggregate([
                {
                    $group: {
                        _id: null,
                        totalOrders: { $sum: 1 },
                        // ✅ QUAN TRỌNG: Dùng "$total" vì trong Model tên trường là total
                        totalRevenue: { $sum: "$total" } 
                    }
                }
            ]),
            // 2. Đếm tổng User
            User.countDocuments(),
            // 3. Đếm tổng Sản phẩm
            Product.countDocuments()
        ]);

        // Xử lý kết quả trả về từ Aggregate
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
// ⭐️ HÀM 9 (FINAL): Thống kê doanh thu cho Biểu đồ
const getRevenueAnalytics = async (req, res) => {
    try {
        const { type } = req.query; // type = 'day', 'week', 'month', 'year'
        const today = new Date();
        let startDate = new Date();
        let groupBy = {};
        
        // 1. Xác định khoảng thời gian và cách nhóm dữ liệu
        switch (type) {
            case 'day': // Theo giờ trong ngày hôm nay
                startDate.setHours(0, 0, 0, 0);
                groupBy = { $hour: "$createdAt" };
                break;
            case 'week': // 7 ngày gần nhất
                startDate.setDate(today.getDate() - 6);
                startDate.setHours(0, 0, 0, 0);
                groupBy = { 
                    $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } 
                };
                break;
            case 'month': // Các ngày trong tháng này
                startDate.setDate(1); // Ngày mùng 1
                startDate.setHours(0, 0, 0, 0);
                groupBy = { 
                    $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } 
                };
                break;
            case 'year': // 12 tháng trong năm nay
                startDate.setMonth(0, 1); // Tháng 1
                startDate.setHours(0, 0, 0, 0);
                groupBy = { $month: "$createdAt" };
                break;
            default: // Mặc định là Year
                startDate.setMonth(0, 1);
                groupBy = { $month: "$createdAt" };
        }

        // 2. Thực hiện Aggregation (Gom nhóm và tính tổng)
        const stats = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate }, // Chỉ lấy đơn từ ngày bắt đầu
                    // status: { $ne: 'cancelled' } // (Tùy chọn) Bỏ qua đơn hủy nếu muốn
                }
            },
            {
                $group: {
                    _id: groupBy, // Nhóm theo Ngày hoặc Tháng hoặc Giờ
                    totalSales: { $sum: "$total" } // Cộng dồn tiền (Check kỹ DB là 'total' hay 'totalPrice')
                }
            },
            { $sort: { _id: 1 } } // Sắp xếp tăng dần theo thời gian
        ]);

        res.status(200).json({ success: true, data: stats });

    } catch (error) {
        console.error("Lỗi Chart API:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
// ⭐️ Xuất tất cả các hàm ⭐️
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