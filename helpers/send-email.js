// helpers/send-email.js

const nodemailer = require('nodemailer');


function createTransporter() {
    const port = parseInt(process.env.EMAIL_PORT) || 587;
    const isSecure = port === 465;
    
    return nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com', 
        port: port, 
        secure: isSecure,
        auth: {
            user: process.env.EMAIL_USER, // Email Gmail đầy đủ (ví dụ: yourname@gmail.com)
            pass: process.env.EMAIL_PASS  // App Password từ Gmail (không phải mật khẩu thông thường)
        },
        connectionTimeout: 60000,
        socketTimeout: 90000,
        greetingTimeout: 30000,
        pool: false,
    });
}

const transporter = createTransporter();

/**
 * Hàm gửi email chung cho dự án
 * @param {string} to - Email người nhận
 * @param {string} subject - Chủ đề email
 * @param {string} htmlContent - Nội dung email (HTML)
 * @returns {boolean} - Trả về true nếu gửi thành công
 */
async function sendEmail({ to, subject, htmlContent }) {
    try {
        // Kiểm tra cấu hình môi trường
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.error("❌ Thiếu cấu hình môi trường email. Kiểm tra EMAIL_USER, EMAIL_PASS");
            console.error("📝 Hướng dẫn:");
            console.error("   - EMAIL_USER: Email Gmail của bạn (ví dụ: yourname@gmail.com)");
            console.error("   - EMAIL_PASS: App Password từ Gmail (tạo tại: https://myaccount.google.com/apppasswords)");
            return false;
        }

        // Kiểm tra kết nối SMTP trước khi gửi
        console.log("🔍 Đang kiểm tra kết nối SMTP...");
        try {
            await transporter.verify();
            console.log("✅ Kết nối SMTP thành công!");
        } catch (verifyError) {
            console.error("❌ Lỗi xác thực SMTP:", verifyError.message);
            return false;
        }

        const mailOptions = {
            from: `"AL-Shop" <${process.env.EMAIL_USER}>`,
            to: to,          
            subject: subject, 
            html: htmlContent
        };

        console.log(`📧 Đang gửi email đến ${to}...`);
        const info = await transporter.sendMail(mailOptions);

        console.log(`✅ Email đã gửi thành công đến ${to}`);
        console.log(`   Message ID: ${info.messageId}`);
        return true;

    } catch (error) {
        console.error("❌ Lỗi khi gửi email:", error.message);
        
        if (error.code) {
            console.error(`❌ Error Code: ${error.code}`);
        }
        if (error.command) {
            console.error(`❌ Command: ${error.command}`);
        }
        if (error.response) {
            console.error(`❌ SMTP Response: ${error.response}`);
        }
        if (error.responseCode) {
            console.error(`❌ Response Code: ${error.responseCode}`);
        }
        
        if (error.message.includes('Invalid login') || error.code === 'EAUTH') {
            console.error("💡 Lỗi xác thực - Kiểm tra:");
            console.error("   - EMAIL_USER phải là email Gmail đầy đủ");
            console.error("   - EMAIL_PASS phải là App Password (16 ký tự, không có dấu cách)");
            console.error("   - Tạo App Password tại: https://myaccount.google.com/apppasswords");
        } else if (error.message.includes('timeout') || error.code === 'ETIMEDOUT') {
            console.error("💡 Lỗi timeout - Kiểm tra:");
            console.error("   - Kết nối internet có ổn định không?");
            console.error("   - Firewall có chặn port 587/465 không?");
            console.error("   - Thử đổi EMAIL_PORT=465 (SSL)");
        } else if (error.code === 'ECONNREFUSED') {
            console.error("💡 Không thể kết nối đến SMTP server");
            console.error("   - Kiểm tra EMAIL_HOST có đúng không?");
            console.error("   - Kiểm tra kết nối internet");
        }
        
        return false;
    }
}

module.exports = { sendEmail };