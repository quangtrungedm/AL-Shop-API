
Cài đặt

1.Clone project
2.Cài đặt packages:

npm install

3. Tạo file `.env`:

PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/al-shop
EMAIL_USER= email
EMAIL_PASS= key email

mn thay username:passworld --- quangtrung:quangtrung123

4. Chạy server:

npm run dev

======================
30/10/2023
Khi IP máy thay đổi:
1. Kt ip máy là gì , thay ip của máy  ,thay ip đó vào trong DO_AN-SHOP-AI/api/client.js,thay tiếp trong AL-Shop/server.js (dòng console.log)

Nếu thêm sản phẩm mới 
Sửa thêm - xoá trong seed-products.js
Chạy: node seed-products.js
Frontend sẽ tự động load sản phẩm mới .

