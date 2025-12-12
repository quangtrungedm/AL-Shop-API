import { useState, useEffect } from 'react';
// ⚠️ Đảm bảo rằng client được import đúng
import client from '../api/client'; 
import { useAuth } from '../context/AuthContext';

const useProfileData = () => {
    const { user, token } = useAuth();
    
    // States cho Dữ liệu
    const [orderCount, setOrderCount] = useState(0);
    const [addressCount, setAddressCount] = useState(0);
    const [cardCount, setCardCount] = useState(0); // Vẫn là Mockup
    
    // States cho Trạng thái tải
    const [isCounting, setIsCounting] = useState(true);

    // Hàm chung để lấy headers (sử dụng Token)
    const getAuthHeaders = () => ({
        headers: { Authorization: `Bearer ${token}` }
    });

    // 1. Fetch số lượng Đơn hàng (GET /orders/count)
    const fetchOrderCountAPI = async () => {
        if (!token) return 0;
        try {
            // ⭐ ĐIỂM CẦN LƯU Ý: Endpoint /api/orders/count là từ backend (Node.js)
            const response = await client.get('/orders/count', getAuthHeaders());
            // Backend trả về { success: true, count: number }
            const count = response.data?.count || 0; 
            console.log(`✅ [DEBUG HOOK] /orders/count: Thành công, Count = ${count}`);
            return count;
        } catch (e) { 
            const errorMsg = e.response?.data?.message || e.message || "Lỗi không xác định";
            console.error(`❌ [DEBUG HOOK] Lỗi API /orders/count (Status: ${e.response?.status || 'N/A'}):`, errorMsg);
            // Trả về 0 nếu thất bại
            return 0; 
        }
    };

    // 2. Fetch số lượng Địa chỉ (GET /addresses/count)
    const fetchAddressCountAPI = async () => {
        if (!token) return 0;
        try {
            // ⭐ ĐIỂM CẦN LƯU Ý: Endpoint /api/addresses/count là từ backend (Node.js)
            const response = await client.get('/addresses/count', getAuthHeaders());
            // Backend trả về { success: true, count: number }
            const count = response.data?.count || 0;
            console.log(`✅ [DEBUG HOOK] /addresses/count: Thành công, Count = ${count}`);
            return count;
        } catch (e) { 
            const errorMsg = e.response?.data?.message || e.message || "Lỗi không xác định";
            console.error(`❌ [DEBUG HOOK] Lỗi API /addresses/count (Status: ${e.response?.status || 'N/A'}):`, errorMsg);
            return 0; 
        }
    };
    
    // 3. Fetch số lượng Thẻ/Payment Methods (Mockup/Fake)
    const fetchCardCountAPI = async () => {
        // Mockup: Giả lập độ trễ 500ms và trả về giá trị cố định
        await new Promise(resolve => setTimeout(resolve, 500)); 
        return 2;
    };

    // --- EFFECT CHÍNH ---
    useEffect(() => {
        if (!user || !token) {
            console.log("[DEBUG HOOK] 🚫 User hoặc Token không tồn tại. Bỏ qua Load Counts.");
            setIsCounting(false);
            return;
        }
        
        console.log("[DEBUG HOOK] 🔄 Bắt đầu tải các Counts cho Profile...");

        const loadAllCounts = async () => {
            setIsCounting(true);
            
            // Chạy tất cả các promises song song để tối ưu hóa hiệu suất
            const results = await Promise.all([
                fetchOrderCountAPI(),
                fetchAddressCountAPI(),
                fetchCardCountAPI(), // Mockup
            ]);

            // Cập nhật trạng thái
            setOrderCount(results[0]);
            setAddressCount(results[1]);
            setCardCount(results[2]);
            
            console.log("[DEBUG HOOK] ✅ Tải Counts Hoàn tất.");
            setIsCounting(false);
        };

        loadAllCounts();
    }, [user, token]); // Dependencies: Chạy lại khi user hoặc token thay đổi

    return {
        orderCount,
        addressCount,
        cardCount,
        isCounting,
    };
};

export default useProfileData;