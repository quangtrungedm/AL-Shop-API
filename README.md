# AL-Shop API

API Backend đơn giản cho ứng dụng bán áo - Đồ án tốt nghiệp

## 📁 Cấu trúc Project

```
AL-Shop/
├── models/              # Database models
│   ├── User.model.js
│   ├── Product.model.js
│   └── Order.model.js
├── controllers/         # Logic xử lý
│   ├── user.controller.js
│   ├── product.controller.js
│   └── order.controller.js
├── routes/             # API routes
│   ├── user.routes.js
│   ├── product.routes.js
│   └── order.routes.js
├── server.js           # File chính
├── package.json
├── .env
└── .gitignore
```

## 🚀 Cài đặt

1. Clone project
2. Cài đặt packages:
```bash
npm install
```

3. Tạo file `.env`:
```
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/al-shop
```

4. Chạy server:
```bash
npm run dev
```

## 📝 API Endpoints

### Users - `/api/users`
- `GET /` - Lấy danh sách users
- `POST /` - Tạo user mới
- `GET /:id` - Lấy thông tin 1 user
- `PUT /:id` - Cập nhật user
- `DELETE /:id` - Xóa user

### Products - `/api/products`
- `GET /` - Lấy danh sách sản phẩm
- `POST /` - Tạo sản phẩm mới
- `GET /:id` - Lấy thông tin 1 sản phẩm
- `PUT /:id` - Cập nhật sản phẩm
- `DELETE /:id` - Xóa sản phẩm

### Orders - `/api/orders`
- `GET /` - Lấy danh sách đơn hàng
- `POST /` - Tạo đơn hàng mới
- `GET /:id` - Lấy thông tin 1 đơn hàng
- `PUT /:id` - Cập nhật đơn hàng

## 🧪 Test API

Sử dụng Postman hoặc curl:

```bash
# Lấy danh sách sản phẩm
curl http://localhost:5000/api/products

# Tạo sản phẩm mới
curl -X POST http://localhost:5000/api/products \
  -H "Content-Type: application/json" \
  -d '{"name":"Áo thun","price":200000,"category":"Áo thun"}'
```

## 📦 Models

### User
```javascript
{
  name: String,
  email: String (unique),
  password: String,
  phone: String,
  role: String (default: 'user')
}
```

### Product
```javascript
{
  name: String,
  description: String,
  price: Number,
  category: String,
  image: String,
  stock: Number
}
```

### Order
```javascript
{
  user: ObjectId (ref: User),
  products: [{
    product: ObjectId (ref: Product),
    quantity: Number,
    price: Number
  }],
  total: Number,
  status: String (default: 'pending')
}
```

## 🌐 MongoDB Atlas

1. Đăng ký tại: https://www.mongodb.com/cloud/atlas
2. Tạo cluster miễn phí
3. Lấy connection string
4. Cập nhật vào file `.env`

## 📚 Technologies

- Node.js
- Express.js
- MongoDB + Mongoose
- dotenv
- cors

---

**Đồ án tốt nghiệp - AL-Shop**
