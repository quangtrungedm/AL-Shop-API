// Script tạo dữ liệu mẫu sản phẩm
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('./models/Product.model');

dotenv.config();

// Dữ liệu sản phẩm mẫu (ảnh từ Unsplash)
const sampleProducts = [
  {
    name: 'POLK DRESS',
    description: 'Áo thun họa tiết chấm bi',
    price: 75.00,
    category: 'T-Shirt',
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500',
    stock: 50
  },
  {
    name: 'Basic Black T-Shirt',
    description: 'Áo thun đen basic',
    price: 35.00,
    category: 'T-Shirt',
    image: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=500',
    stock: 100
  },
  {
    name: 'White Plain T-Shirt',
    description: 'Áo thun trắng trơn',
    price: 33.00,
    category: 'T-Shirt',
    image: 'https://images.unsplash.com/photo-1622445275576-721325763afe?w=500',
    stock: 80
  },
  {
    name: 'POLK DRESS Beige',
    description: 'Áo thun họa tiết màu be',
    price: 28.00,
    category: 'T-Shirt',
    image: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=500',
    stock: 60
  },
  {
    name: 'Black Polo Shirt',
    description: 'Áo polo đen cao cấp',
    price: 55.00,
    category: 'Polo',
    image: 'https://images.unsplash.com/photo-1607345366928-199ea26cfe3e?w=500',
    stock: 40
  },
  {
    name: 'Navy Short',
    description: 'Quần short xanh navy',
    price: 45.00,
    category: 'Short',
    image: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=500',
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

