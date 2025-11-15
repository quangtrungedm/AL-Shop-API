const Order = require('../models/Order.model');
const Product = require('../models/Product.model'); 
const { createNotification } = require('../helpers/notification-helper'); 

// ⭐️ Định nghĩa hàm 1: Lấy danh sách TẤT CẢ đơn hàng (Admin)
const getOrders = async (req, res) => {
    console.log("DEBUG ORDER: Getting all orders (Admin).");
    try {
        const orders = await Order.find()
            .populate('user', 'name email')
            .populate('products.product', 'name price image');
        res.json({ success: true, data: orders });
    } catch (error) {
        console.error("ERROR GET_ORDERS:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ⭐️ Định nghĩa hàm 2: Lấy danh sách đơn hàng CỦA MỘT NGƯỜI DÙNG (Frontend)
const getOrdersByUser = async (req, res) => {
    const userId = req.user._id; 
    console.log(`DEBUG ORDER: Getting orders for User ID: ${userId}`);

    try {
        const orders = await Order.find({ user: userId }) 
            .sort({ orderDate: -1 }) 
            .populate('products.product', 'name price image'); 
            
        res.status(200).json({ success: true, data: orders });
    } catch (error) {
        console.error("ERROR GET_ORDERS_BY_USER:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ⭐️ Định nghĩa hàm 3: Tạo đơn hàng mới
const createOrder = async (req, res) => {
    console.log("DEBUG ORDER: Received new order request.");
    try {
        const newOrder = await Order.create(req.body); 

        // Logic lấy URL ảnh cho thông báo
        let imageUrl = null;
        const firstProductItem = newOrder.products[0];
        
        if (firstProductItem && firstProductItem.product) {
            try {
                const productDetail = await Product.findById(firstProductItem.product).select('image');
                if (productDetail && productDetail.image && productDetail.image.length > 0) {
                    imageUrl = productDetail.image[0]; 
                }
            } catch (imageError) {
                console.warn("WARNING: Could not fetch product image details.", imageError.message);
            }
        }
        
        // Logic tạo thông báo
        const orderId = newOrder._id;
        const userId = newOrder.user; 
        const orderTotal = newOrder.total ? newOrder.total.toFixed(2) : '0.00'; 
        
        await createNotification({
            userId: userId,
            title: `Đơn hàng #${orderId.toString().slice(-6)} đã được xác nhận!`,
            description: `Đơn hàng trị giá $${orderTotal} của bạn đã được tiếp nhận và đang chờ xử lý.`,
            type: 'ORDER_STATUS',
            referenceId: orderId,
            image: imageUrl, 
        });

        res.status(201).json({ 
            success: true, 
            data: newOrder, 
            message: "Đặt hàng thành công. Lịch sử đã được ghi nhận."
        });
    } catch (error) {
        console.error("ERROR CREATE_ORDER - Chi tiết lỗi 400:", error.message);
        res.status(400).json({ success: false, message: error.message });
    }
};

// ⭐️ Định nghĩa hàm 4: Lấy thông tin 1 đơn hàng
const getOrderById = async (req, res) => {
    console.log(`DEBUG ORDER: Getting order by ID: ${req.params.id}`);
    try {
        const order = await Order.findById(req.params.id)
            .populate('user', 'name email')
            .populate('products.product', 'name price image');
        if (!order) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
        }
        res.json({ success: true, data: order });
    } catch (error) {
        console.error("ERROR GET_ORDER_BY_ID:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ⭐️ Định nghĩa hàm 5: Cập nhật trạng thái đơn hàng
const updateOrder = async (req, res) => {
    console.log(`DEBUG ORDER: Updating order ID: ${req.params.id}`);
    try {
        const order = await Order.findByIdAndUpdate(req.params.id, req.body, { new: true });
        // TODO: THÊM logic gửi thông báo khi trạng thái đơn hàng thay đổi
        res.json({ success: true, data: order });
    } catch (error) {
        console.error("ERROR UPDATE_ORDER:", error.message);
        res.status(400).json({ success: false, message: error.message });
    }
};

// ⭐️ ĐẢM BẢO XUẤT TẤT CẢ CÁC HÀM ĐÃ ĐỊNH NGHĨA BẰNG CONST ⭐️
module.exports = {
    getOrders,          // Đã được định nghĩa bằng const
    getOrdersByUser,    // Đã được định nghĩa bằng const
    createOrder,
    getOrderById,
    updateOrder,
};