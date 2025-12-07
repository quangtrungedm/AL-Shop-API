const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: String,
  description: String,
  price: Number,
  category: String,
  image: [String], 
  stock: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true } }, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);