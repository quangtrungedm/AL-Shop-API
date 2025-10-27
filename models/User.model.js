const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  phone: String,
  role: { type: String, default: 'user' },
  //thêm trường bảo vệ
  favorites: [
      {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product' 
      }
  ]
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
