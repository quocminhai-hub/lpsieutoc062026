import "./globals.css";

export const metadata = {
  title: "LuyenAI - Khóa Học PageForge AI: Landing Page Siêu Tốc",
  description: "Học sinh dùng AI tạo landing page bán hàng triệu đô trong 60 giây. Tích hợp thanh toán, tự động hóa và tối ưu chuyển đổi.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body>{children}</body>
    </html>
  );
}
