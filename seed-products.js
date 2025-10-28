// Script tạo dữ liệu mẫu sản phẩm
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('./models/Product.model');

dotenv.config();

// Dữ liệu sản phẩm mẫu
const sampleProducts = [
  {
    name: 'POLK DRESS',
    description: 'Áo thun họa tiết chấm bi',
    price: 75.00,
    category: 'T-Shirt',
    image: 'https://product.hstatic.net/200000690725/product/1_92c3e628087d4bdaa9bc1ed9b1fb1f5c_master.jpg',
    stock: 50
  },
  {
    name: 'Basic Black T-Shirt',
    description: 'Áo thun đen basic',
    price: 35.00,
    category: 'T-Shirt',
    image: 'https://product.hstatic.net/200000690725/product/50bls_2_5bf9ccfd99ad4b5e858666f8c1b77a5e_master.jpg',
    stock: 100
  },
  {
    name: 'White Plain T-Shirt',
    description: 'Áo thun trắng trơn',
    price: 33.00,
    category: 'T-Shirt',
    image: 'https://product.hstatic.net/200000690725/product/50wtb_2_8e0e91d5c8bf49f5b29a5a61968bf1e8_master.jpg',
    stock: 80
  },
  {
    name: 'POLK DRESS Beige',
    description: 'Áo thun họa tiết màu be',
    price: 28.00,
    category: 'T-Shirt',
    image: 'https://product.hstatic.net/200000690725/product/2_7a6f3e2c84794e5b8b2c2c4e6b0d8c8f_master.jpg',
    stock: 60
  },
  {
    name: 'Black Polo Shirt',
    description: 'Áo polo đen cao cấp',
    price: 55.00,
    category: 'Polo',
    image: 'https://product.hstatic.net/200000690725/product/black-polo_master.jpg',
    stock: 40
  },
  {
    name: 'Navy Short',
    description: 'Quần short xanh navy',
    price: 45.00,
    category: 'Short',
    image: 'https://product.hstatic.net/200000690725/product/navy-short_master.jpg',
    stock: 55
  }
];

// Kết nối DB và thêm dữ liệu
const seedDatabase = async () => {
  try {
    // Kết nối MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Đã kết nối MongoDB');

    // Xóa dữ liệu cũ (nếu có)
    await Product.deleteMany({});
    console.log('🗑️  Đã xóa dữ liệu cũ');

    // Thêm dữ liệu mới
    const results = await Product.insertMany(sampleProducts);
    console.log(`✅ Đã thêm ${results.length} sản phẩm mẫu`);

    // Hiển thị danh sách
    results.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name} - $${product.price}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi:', error);
    process.exit(1);
  }
};

seedDatabase();

