const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Kết nối MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('--> Đã kết nối MongoDB'))
  .catch(err => console.log('Lỗi kết nối:', err));

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'AL-Shop API',
    version: '1.0.0',
    endpoints: {
      users: '/api/users',
      products: '/api/products',
      orders: '/api/orders'
    }
  });
});

app.use('/api/users', require('./routes/user.routes'));
app.use('/api/products', require('./routes/product.routes'));
app.use('/api/orders', require('./routes/order.routes'));

// Error handling
app.use((err, req, res, next) => {
  res.status(500).json({ success: false, message: err.message });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`--> Server đang chạy tại http://localhost:${PORT}`);
  console.log(`--> Truy cập từ mạng: http://172.20.10.2:${PORT}`);
});
