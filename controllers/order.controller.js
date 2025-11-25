// File: controllers/order.controller.js (ĐÃ FIX LỖI TÌM KIẾM THEO ID)

const Order = require('../models/Order.model');
const Product = require('../models/Product.model'); 
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
        
        const newOrder = await Order.create(req.body); 

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

// ⭐️ Hàm 4: Lấy thông tin 1 đơn hàng (ĐÃ SỬA: Kiểm tra quyền sở hữu và bắt lỗi ID)
const getOrderById = async (req, res) => {
    const orderId = req.params.id;
    const userId = getUserId(req);
    console.log(`DEBUG ORDER: Getting order by ID: ${orderId}. Checking user: ${userId}`);
    
    // Nếu bạn có Admin Middleware riêng, hãy dùng nó để bỏ qua bước kiểm tra userId
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
            // Trả về 404 nếu không tìm thấy hoặc không có quyền truy cập
            return res.status(404).json({ success: false, message: 'Order not found or access denied.' });
        }
        res.json({ success: true, data: order });
    } catch (error) {
        console.error("ERROR GET_ORDER_BY_ID:", error.message);
        // 🚨 QUAN TRỌNG: Bắt lỗi CastError nếu ID không hợp lệ
        if (error.name === 'CastError') {
             return res.status(400).json({ success: false, message: "Invalid Order ID format." });
        }
        res.status(500).json({ success: false, message: "Failed to retrieve order details." });
    }
};

// ⭐️ Hàm 5: Cập nhật trạng thái đơn hàng (Thường là Admin)
const updateOrder = async (req, res) => {
    console.log(`DEBUG ORDER: Updating order ID: ${req.params.id}`);
    try {
        // Có thể cần thêm logic kiểm tra quyền Admin tại đây
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

// ⭐️ Hàm 6: Đếm số lượng đơn hàng của người dùng ⭐️
const getOrderCount = async (req, res) => {
    const userId = getUserId(req); 

    console.log(`DEBUG COUNT: Attempting to count orders for ID: ${userId}`);

    if (!userId) {
        console.error("ERROR: User ID is missing after authentication.");
        return res.status(401).json({ success: false, message: "Authentication required." });
    }

    try {
        const count = await Order.countDocuments({ user: userId });
        console.log(`DEBUG COUNT: Success! Found ${count} orders for user.`);
        res.json({ success: true, count: count });
    } catch (error) {
        console.error("CRITICAL ERROR in getOrderCount:", error); 
        res.status(500).json({ success: false, message: "Internal server error while counting orders." });
    }
};

// ⭐️ Xuất tất cả các hàm ⭐️
module.exports = {
    getOrders,          
    getOrdersByUser,    
    createOrder,
    getOrderById,
    updateOrder,
    getOrderCount
};