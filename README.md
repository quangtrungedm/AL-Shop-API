````markdown
# AL-Shop Project

Tài liệu hướng dẫn cài đặt và khởi chạy dự án AL-Shop.

## 🛠 Yêu cầu hệ thống
* [Node.js](https://nodejs.org/) (Khuyến nghị phiên bản LTS mới nhất)
* [MongoDB](https://www.mongodb.com/) (Tài khoản Atlas hoặc cài đặt Local)

## 🚀 Hướng dẫn Cài đặt

### 1. Sao chép mã nguồn (Clone Project)
Mở terminal và chạy lệnh sau để tải project về máy:
```bash
git clone <link-repo-cua-ban>
cd AL-Shop
````

### 2\. Cài đặt thư viện (Dependencies)

Cài đặt các gói npm cần thiết cho dự án:

```bash
npm install
```

### 3\. Cấu hình biến môi trường (.env)

Tạo một file tên là `.env` tại thư mục gốc của dự án và điền các thông tin sau:

```env
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/al-shop
EMAIL_USER=email
EMAIL_PASS=key email
```

> **Thông tin đăng nhập mẫu (nếu dùng chung):**
>
>   * Username: `quangtrung`
>   * Password: `quangtrung123`

### 4\. Khởi chạy Server

Chạy lệnh sau để bắt đầu môi trường phát triển:

```bash
npm run dev
```

-----

## ⚠️ Xử lý sự cố & Cập nhật (Notes)

### 1\. Cấu hình IP (Khi thay đổi mạng Wifi/Localhost)

Khi địa chỉ IP của máy tính thay đổi (do đổi mạng hoặc reset modem), cần cập nhật IP để App/Frontend gọi API thành công.

  * **Bước 1:** Kiểm tra IP hiện tại của máy (Windows: `ipconfig`, Mac/Linux: `ifconfig`).
  * **Bước 2:** Cập nhật file `DO_AN-SHOP-AI/api/client.js` -\> Thay thế bằng IP mới.
  * **Bước 3:** Cập nhật file `AL-Shop/server.js` (dòng console.log) -\> Để hiển thị đúng log.

### 2\. Quản lý dữ liệu sản phẩm (Seeding Data)

Khi cần thêm mới, sửa đổi hoặc reset danh sách sản phẩm:

1.  Chỉnh sửa file `seed-products.js` (thêm/xóa/sửa data trong code).
2.  Chạy lệnh cập nhật:
    ```bash
    node seed-products.js
    ```
3.  Frontend sẽ tự động cập nhật dữ liệu mới.

<!-- end list -->

```

Bạn có muốn tôi tạo thêm file `.gitignore` để tránh đẩy file `node_modules` và `.env` lên git không?
```
