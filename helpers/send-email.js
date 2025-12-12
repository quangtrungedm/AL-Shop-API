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
            console.error("❌ Missing email environment configuration. Check EMAIL_FROM, EMAIL_USER, EMAIL_PASS.");
            return false;
        }

        // Kiểm tra kết nối SMTP
        console.log("🔍 Checking SMTP connection...");
        try {
            await transporter.verify();
            console.log("✅ SMTP Connection Successful!");
        } catch (verifyError) {
            console.error("❌ SMTP Authentication Error (SendGrid):", verifyError.message);
            console.error("💡 Check EMAIL_USER (must be apikey) and EMAIL_PASS (API Key).");
            return false;
        }

        const mailOptions = {
            // ✅ SỬA LỖI: Dùng EMAIL_FROM chứa địa chỉ đã xác minh của SendGrid
            from: process.env.EMAIL_FROM,
            to: to,
            subject: subject,
            html: htmlContent
        };

        console.log(`📧 Sending email to ${to} from ${process.env.EMAIL_FROM}...`);
        const info = await transporter.sendMail(mailOptions);

        console.log(`✅ Email sent successfully to ${to}. Message ID: ${info.messageId}`);
        return true;

    } catch (error) {
        console.error("❌ SEND MAIL ERROR (SendGrid SMTP):", error.message);

        // Cải tiến xử lý lỗi phổ biến của SendGrid
        if (error.responseCode === 550 && error.message.includes('verified Sender Identity')) {
            console.error("🔥 ERROR FROM SENDGRID: Sender Identity (FROM address) not verified. Please check your SendGrid account.");
        } else if (error.code === 'EAUTH' || error.message.includes('Invalid login')) {
            console.error("🔥 AUTH ERROR: Invalid API Key or apikey Username.");
        } else if (error.code === 'ETIMEDOUT') {
            console.error("⚠️ CONNECTION ERROR: Check internet connection/Firewall.");
        }

        return false;
    }
}

module.exports = { sendEmail };