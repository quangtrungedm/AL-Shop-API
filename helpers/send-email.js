const nodemailer = require('nodemailer');

// Đảm bảo thư viện dotenv đã được tải ở đâu đó trong dự án của bạn (ví dụ: file server chính)

function createTransporter() {
    // Port 587 (TLS) là tiêu chuẩn cho SendGrid SMTP.
    const port = parseInt(process.env.EMAIL_PORT) || 587; 
    const isSecure = port === 465;
    
    return nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.sendgrid.net', // Mặc định là SendGrid
        port: port, 
        secure: isSecure,
        auth: {
            user: process.env.EMAIL_USER, // Phải là "apikey"
            pass: process.env.EMAIL_PASS  // Phải là SendGrid API Key
        },
        connectionTimeout: 15000, 
        socketTimeout: 30000,
    });
}

const transporter = createTransporter();

async function sendEmail({ to, subject, htmlContent }) {
    try {
        // Kiểm tra cấu hình bắt buộc
        if (!process.env.EMAIL_FROM || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.error("❌ Thiếu cấu hình môi trường email. Kiểm tra EMAIL_FROM, EMAIL_USER, EMAIL_PASS.");
            return false;
        }

        // Kiểm tra kết nối SMTP
        console.log("🔍 Đang kiểm tra kết nối SMTP...");
        try {
            await transporter.verify();
            console.log("✅ Kết nối SMTP thành công!");
        } catch (verifyError) {
            console.error("❌ Lỗi xác thực SMTP (SendGrid):", verifyError.message);
            console.error("💡 Kiểm tra lại EMAIL_USER (phải là apikey) và EMAIL_PASS (API Key).");
            return false;
        }

        const mailOptions = {
            // ✅ SỬA LỖI: Dùng EMAIL_FROM chứa địa chỉ đã xác minh của SendGrid
            from: process.env.EMAIL_FROM, 
            to: to, 
            subject: subject, 
            html: htmlContent
        };

        console.log(`📧 Đang gửi email đến ${to} từ ${process.env.EMAIL_FROM}...`);
        const info = await transporter.sendMail(mailOptions);

        console.log(`✅ Email đã gửi thành công đến ${to}. Message ID: ${info.messageId}`);
        return true;

    } catch (error) {
        console.error("❌ LỖI GỬI MAIL (SendGrid SMTP):", error.message);
        
        // Cải tiến xử lý lỗi phổ biến của SendGrid
        if (error.responseCode === 550 && error.message.includes('verified Sender Identity')) {
            console.error("🔥 LỖI TỪ SENDGRID: Địa chỉ FROM chưa được xác minh. Vui lòng kiểm tra lại tài khoản SendGrid của bạn.");
        } else if (error.code === 'EAUTH' || error.message.includes('Invalid login')) {
            console.error("🔥 LỖI XÁC THỰC: API Key hoặc apikey Username bị sai.");
        } else if (error.code === 'ETIMEDOUT') {
            console.error("⚠️ LỖI KẾT NỐI: Kiểm tra kết nối internet/Firewall.");
        }
        
        return false;
    }
}

module.exports = { sendEmail };