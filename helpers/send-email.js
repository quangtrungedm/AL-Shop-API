// helpers/send-email.js

const nodemailer = require('nodemailer');

// 🔑 Khởi tạo Transporter với các biến môi trường của SendGrid
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST, 
    port: process.env.EMAIL_PORT, 
    secure: false, // port 587 dùng STARTTLS
    auth: {
        user: process.env.EMAIL_USER, // apikey
        pass: process.env.EMAIL_PASS  // API Key SG.xxx...
    }
});

/**
 * Hàm gửi email chung cho dự án
 * @param {string} to - Email người nhận
 * @param {string} subject - Chủ đề email
 * @param {string} htmlContent - Nội dung email (HTML)
 * @returns {boolean} - Trả về true nếu gửi thành công
 */
async function sendEmail({ to, subject, htmlContent }) {
    try {
        const mailOptions = {
            from: process.env.EMAIL_FROM, // Địa chỉ đã được xác minh
            to: to,          
            subject: subject, 
            html: htmlContent
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ Email đã gửi thành công. Message ID: ${info.messageId}`);
        return true;

    } catch (error) {
        console.error("❌ Lỗi khi gửi email:", error.message);
        // Lời khuyên: Ghi log chi tiết lỗi từ SendGrid
        return false;
    }
}

module.exports = { sendEmail };