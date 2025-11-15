const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: String,
  description: String,
  price: Number,
  category: String,
  // ⭐️ FIX LỖI: Chuyển từ String sang [String] (Mảng chuỗi) ⭐️
  image: [String], 
  stock: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);