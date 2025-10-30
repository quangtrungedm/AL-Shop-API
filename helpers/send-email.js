const nodemailer = require('nodemailer');

async function sendOtpEmail(email, otp) {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });
    await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'AL-Shop OTP Password Reset',
        text: `Mã OTP của bạn: ${otp} (có hiệu lực 5 phút)`
    });
}

module.exports = { sendOtpEmail };
