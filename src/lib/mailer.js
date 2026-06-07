import nodemailer from 'nodemailer';

function createTransporter() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !port || !user || !pass) {
    console.warn('CẢNH BÁO: Thiếu cấu hình SMTP trong .env. Không thể gửi email.');
    return null;
  }

  return nodemailer.createTransport({
    host,
    port: parseInt(port),
    secure: port === '465', // true cho 465, false cho 587 hoặc cổng khác
    auth: {
      user,
      pass,
    },
  });
}

// 1. Gửi email thông báo cho Admin khi có người đăng ký mới
export async function sendAdminNotification(data) {
  try {
    const transporter = createTransporter();
    if (!transporter) return false;

    const adminEmail = process.env.ADMIN_RECEIVE_EMAIL || process.env.SMTP_USER;

    const mailOptions = {
      from: `"LuyenAI System" <${process.env.SMTP_USER}>`,
      to: adminEmail,
      subject: `[Đăng Ký Mới] Học viên ${data.name} vừa đăng ký khóa học`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; color: #333;">
          <h2 style="color: #ff6600; border-bottom: 2px solid #ff6600; padding-bottom: 10px;">Có Đăng Ký Mới Từ Landing Page</h2>
          <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; width: 30%;">Họ và tên:</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${data.name}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Email nhận học:</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${data.email}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Số điện thoại:</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${data.phone}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Số tiền:</td>
              <td style="padding: 8px; border: 1px solid #ddd; color: #ff6600; font-weight: bold;">${data.amount.toLocaleString('vi-VN')} VNĐ</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Nội dung chuyển khoản:</td>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; background-color: #f9f9f9; color: #d32f2f;">${data.transferCode}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Thời gian đăng ký:</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}</td>
            </tr>
          </table>
          <p style="margin-top: 20px; font-size: 14px; color: #666;">
            Vui lòng kiểm tra tài khoản ngân hàng. Sau khi nhận được thanh toán, hãy vào trang <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://luyenai.io.vn'}/dashboard" target="_blank">Dashboard Admin</a> để phê duyệt và cấp tài khoản cho học viên.
          </p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Đã gửi email thông báo cho Admin:', info.messageId);
    return true;
  } catch (error) {
    console.error('Lỗi gửi email thông báo cho Admin:', error);
    return false;
  }
}

// 2. Gửi email chứa thông tin tài khoản kích hoạt cho Học viên
export async function sendStudentCredentials(studentEmail, studentName, plainPassword) {
  try {
    const transporter = createTransporter();
    if (!transporter) return false;

    const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://luyenai.io.vn'}/login`;

    const mailOptions = {
      from: `"LuyenAI Support" <${process.env.SMTP_USER}>`,
      to: studentEmail,
      subject: `[LuyenAI] Tài khoản học tập của bạn đã được kích hoạt thành công!`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 25px; line-height: 1.6; color: #222; background-color: #f9f9f9;">
          <div style="background-color: #111; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
            <h1 style="color: #ffaa00; margin: 0; font-size: 24px;">KÍCH HOẠT TÀI KHOẢN THÀNH CÔNG</h1>
          </div>
          <div style="background-color: #fff; padding: 25px; border: 1px solid #eee; border-radius: 0 0 5px 5px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            <p>Chào <strong>${studentName}</strong>,</p>
            <p>Cảm ơn bạn đã hoàn tất đăng ký khóa học tại LuyenAI. Tài khoản học tập của bạn đã được kích hoạt thành công trên hệ thống của chúng tôi.</p>
            
            <div style="background-color: #fffde7; border-left: 4px solid #ffaa00; padding: 15px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #e65100;">Thông tin đăng nhập của bạn:</h3>
              <p style="margin: 5px 0;"><strong>Đường dẫn học tập:</strong> <a href="${loginUrl}" style="color: #ff6600; font-weight: bold;">${loginUrl}</a></p>
              <p style="margin: 5px 0;"><strong>Email đăng nhập:</strong> <span style="font-family: monospace; font-size: 15px;">${studentEmail}</span></p>
              <p style="margin: 5px 0;"><strong>Mật khẩu:</strong> <span style="font-family: monospace; font-size: 15px; font-weight: bold; color: #c62828;">${plainPassword}</span></p>
            </div>
            
            <p style="color: #ff0000; font-weight: bold;">Lưu ý bảo mật:</p>
            <p style="margin-top: 0; font-size: 14px;">Bạn vui lòng không chia sẻ tài khoản này với bất kỳ ai để đảm bảo quyền lợi và tiến trình học tập của chính mình.</p>
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="${loginUrl}" style="background-color: #ff6600; color: #fff; text-decoration: none; padding: 12px 30px; font-weight: bold; border-radius: 5px; display: inline-block; box-shadow: 0 2px 4px rgba(0,0,0,0.15);">VÀO TRANG HỌC TẬP NGAY</a>
            </div>
          </div>
          <p style="text-align: center; font-size: 12px; color: #888; margin-top: 20px;">
            Hệ thống tự động gửi từ LuyenAI. Mọi thắc mắc xin liên hệ bộ phận hỗ trợ của chúng tôi.
          </p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Đã gửi email thông tin đăng nhập cho học viên:', info.messageId);
    return true;
  } catch (error) {
    console.error('Lỗi gửi email thông tin đăng nhập cho học viên:', error);
    return false;
  }
}
