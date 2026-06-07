# HƯỚNG DẪN NHÂN BẢN HỆ THỐNG LUYENAI (SADOMA AI)
> Tài liệu tóm tắt quy trình phát triển và các lưu ý kỹ thuật quan trọng để nhân bản dự án tương tự.

---

## 📌 Cấu Trúc Tổng Quan Hệ Thống

Dự án là một ứng dụng Next.js fullstack sử dụng:
1. **Next.js 16 (App Router)** - Giao diện Dark Mode cao cấp, không dùng Tailwind CSS (chỉ dùng CSS Module + CSS Variables).
2. **Prisma 7 + Neon PostgreSQL** - Hệ quản trị cơ sở dữ liệu cloud.
3. **Google Sheets API** - Tự động đồng bộ thông tin đăng ký học viên.
4. **Nodemailer (SMTP)** - Tự động gửi email thông báo cho Admin & mật khẩu cho Học viên.
5. **VietQR API** - Sinh mã QR chuyển khoản ngân hàng động theo thông tin đăng ký học viên.

---

## 🛠 Quy Trình Thiết Lập Dự Án Từ Đầu

### Bước 1: Khởi Tạo Dự Án Next.js
Khởi tạo dự án Next.js 16 với cấu trúc thư mục `src/`:
```bash
npx create-next-app@16.2.7 luyenai-clone --js --src-dir --eslint --no-tailwind --no-app-router-no
```
*(Nếu dùng App Router mặc định thì không cần flag phụ, đảm bảo cài đúng version React 19 và Next 16).*

### Bước 2: Cài Đặt Các Dependencies
Cài đặt các thư viện lõi cho Cơ sở dữ liệu, Xác thực, Email và Google Sheets:
```bash
npm install @prisma/client @prisma/adapter-pg pg jose bcryptjs nodemailer googleapis dotenv
npm install -D prisma
```

---

## ⚠️ CÁC BẪY KỸ THUẬT LỚN ĐÃ GIẢI QUYẾT (LƯU Ý KHI NHÂN BẢN)

### 1. Sự Thay Đổi Lớn Của Prisma 7 (Bẫy cực kỳ dễ dính)
Prisma 7 giới thiệu những thay đổi phá vỡ cấu trúc cũ (breaking changes) so với Prisma 5/6:
* **Không đặt `url` trực tiếp trong `prisma/schema.prisma`**: URL kết nối phải được cấu hình thông qua file `prisma.config.ts`.
* **Phải sử dụng Connection Adapter**: `new PrismaClient()` trống không không hoạt động trên serverless nữa. Cần dùng adapter `@prisma/adapter-pg` để kết nối PostgreSQL:
  ```javascript
  // src/lib/db.js
  import { Pool } from 'pg';
  import { PrismaPg } from '@prisma/adapter-pg';
  import { PrismaClient } from '@prisma/client';

  const connectionString = `${process.env.DATABASE_URL}`;
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);

  const globalForPrisma = globalThis;
  export const prisma = globalForPrisma.prisma || new PrismaClient({ adapter });

  if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
  export default prisma;
  ```
* **File cấu hình `prisma.config.ts` ở thư mục gốc**:
  ```typescript
  import { defineConfig } from 'prisma';
  import dotenv from 'dotenv';
  dotenv.config();

  export default defineConfig({
    datasource: {
      url: process.env.DATABASE_URL,
    },
  });
  ```

### 2. Next.js 16 Proxy thay cho Middleware truyền thống
Ở phiên bản Next.js mới, cơ chế Middleware cũ bị hạn chế. Dự án sử dụng một file trung gian `src/proxy.js` làm lớp bảo mật định tuyến để lọc và phân quyền các trang `/dashboard`, `/login` dựa trên JWT Cookie.

### 3. Vercel Framework Preset
Khi deploy lên Vercel, nếu không được cấu hình sẵn, Vercel có thể hiểu nhầm project thuộc loại "Other" dẫn tới lỗi 404 trên các API route.
* **Giải pháp**: Tạo file `vercel.json` ở thư mục gốc:
  ```json
  {
    "framework": "nextjs"
  }
  ```

---

## 📂 Các File Mã Nguồn Cốt Lõi Để Clone

### 1. Cơ sở dữ liệu (`prisma/schema.prisma`)
Định nghĩa 5 bảng quan trọng:
* `User`: Lưu tài khoản (ADMIN hoặc STUDENT).
* `Course`: Thông tin khóa học.
* `Lecture`: Bài học con của khóa học (lưu ID video Youtube).
* `Enrollment`: Bảng liên kết Học viên được học những Khóa học nào.
* `Registration`: Lưu thông tin học viên đăng ký từ Landing Page (chờ duyệt).

### 2. Tích Hợp Đồng Bộ Google Sheet (`src/lib/sheets.js`)
Sử dụng **Google Service Account** để tự động ghi đè/append thêm dòng dữ liệu học viên đăng ký mới vào Google Sheet:
* Yêu cầu biến: `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY` và `GOOGLE_SHEET_ID`.
* Phải chia sẻ Google Sheet cho Service Account dưới quyền **Editor**.

### 3. Tích Hợp Gửi Email (`src/lib/mailer.js`)
* `sendAdminNotification`: Gửi mail báo cho Admin khi có người đăng ký & chọn VietQR thanh toán.
* `sendStudentCredentials`: Gửi mail thông tin tài khoản đăng nhập (Email + mật khẩu ngẫu nhiên) cho Học viên khi Admin bấm duyệt trên dashboard.

### 4. Tích Hợp VietQR Động (`src/app/page.js`)
Tự động sinh mã QR của ngân hàng MB Bank bằng API VietQR dựa vào thông tin của học viên:
```javascript
`https://img.vietqr.io/image/${BANK_ID}-${ACCOUNT_NO}-compact2.png?amount=${amount}&addInfo=${transferCode}&accountName=${accountName}`
```
* **Quy tắc tạo mã chuyển khoản**: `PAGEF <Tên viết tắt không dấu> <Số điện thoại>` (Ví dụ: `PAGEF Nam 0912345678`). Quy tắc này giúp hệ thống tạo ra mã duy nhất và tránh trùng lặp nội dung khi nhiều người mua cùng lúc.

---

## 🚀 Quy Trình Build & Deploy Vercel (Khi nhân bản)

1. **GitHub**: Đẩy mã nguồn lên GitHub repository mới.
2. **Vercel**: Liên kết repository mới vào dự án Vercel.
3. **Cấu hình câu lệnh Build (quan trọng)**:
   Trong `package.json`, phần scripts sửa lại lệnh build để đảm bảo cơ sở dữ liệu luôn khớp với Prisma Schema:
   ```json
   "build": "prisma generate && prisma db push && next build"
   ```
4. **Thiết lập biến môi trường (Environment Variables) trên Vercel**:
   Copy toàn bộ danh sách biến dưới đây và dán vào phần cài đặt của Vercel:

```env
# 1. Cơ sở dữ liệu (Neon PostgreSQL)
DATABASE_URL="postgresql://neondb_owner:..."

# 2. Bảo mật JWT
JWT_SECRET="chuoi-bao-mat-ngau-nhien-cua-ban"

# 3. URL của trang web
NEXT_PUBLIC_APP_URL="https://ten-mien-cua-ban.vercel.app"

# 4. Tài khoản ngân hàng VietQR & Giá bán
NEXT_PUBLIC_BANK_ID="MB"
NEXT_PUBLIC_BANK_NAME="MB Bank"
NEXT_PUBLIC_ACCOUNT_NO="0913579509"
NEXT_PUBLIC_ACCOUNT_NAME="PHU QUOC NAM"
NEXT_PUBLIC_COURSE_PRICE=1490000
NEXT_PUBLIC_OLD_PRICE=35580000

# 5. Cấu hình gửi mail (SMTP)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="gmail-cua-ban@gmail.com"
SMTP_PASS="mat-khau-ung-dung-gmail"
ADMIN_RECEIVE_EMAIL="gmail-nhan-thong-bao-admin@gmail.com"

# 6. Cấu hình Google Sheets
GOOGLE_SERVICE_ACCOUNT_EMAIL="..."
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBA...\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEET_ID="..."
GOOGLE_SHEET_RANGE="Sheet1!A:G"
```

5. **Kích hoạt tài khoản Admin mặc định sau khi db push**:
   Chạy lệnh seed tại local để tạo tài khoản admin mẫu trên Neon Cloud DB:
   ```bash
   npm run seed
   ```
   Tài khoản Admin mặc định: `admin@luyenai.io.vn` / mật khẩu `admin123`.

---
*Tài liệu này được biên soạn bởi Antigravity để phục vụ việc bảo trì và nhân bản hệ thống LuyenAI.*
