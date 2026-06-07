import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { appendToSheet } from '@/lib/sheets';
import { sendAdminNotification } from '@/lib/mailer';

// Hàm xóa dấu tiếng Việt viết thường và hoa
function removeVietnameseTones(str) {
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
  str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
  str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
  str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
  str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
  str = str.replace(/đ/g, "d");
  str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
  str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
  str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
  str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
  str = str.replace(/Ù|Ú|Ụ|Ủ|U|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
  str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y");
  str = str.replace(/Đ/g, "D");
  str = str.replace(/\u0300|\u0301|\u0303|\u0309|\u0323/g, ""); // Huyền sắc hỏi ngã nặng
  str = str.replace(/\u02C6|\u0306|\u031B/g, ""); // Â, Ă, Ơ, Ư
  return str;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email, phone } = body;

    if (!name || !email || !phone) {
      return NextResponse.json({ error: 'Vui lòng nhập đầy đủ các trường thông tin' }, { status: 400 });
    }

    // Chuẩn hóa tên (bỏ dấu) để sinh mã chuyển khoản
    const cleanedName = removeVietnameseTones(name).replace(/[^a-zA-Z0-9 ]/g, "").trim();
    // Lấy từ cuối cùng của tên (tên riêng)
    const nameWords = cleanedName.split(/\s+/);
    const lastWord = nameWords[nameWords.length - 1] || 'HocVien';
    
    // Tạo nội dung chuyển khoản mẫu: PAGEF <Tên riêng> <Số điện thoại>
    // Ví dụ: PAGEF Nam 0912345678
    const transferCode = `PAGEF ${lastWord} ${phone.replace(/\s+/g, '')}`;

    const amount = 1490000; // Giá bán gói PRO Lifetime

    // 1. Lưu đăng ký vào cơ sở dữ liệu
    const registration = await prisma.registration.create({
      data: {
        name,
        email: email.toLowerCase(),
        phone,
        amount,
        transferCode,
        status: 'PENDING',
      },
    });

    console.log(`Đã lưu thông tin đăng ký: ${email} với mã chuyển khoản: ${transferCode}`);

    // 2. Ghi dữ liệu vào Google Sheet (chạy nền không block client)
    appendToSheet(registration).then((success) => {
      if (success) console.log('Đã cập nhật Google Sheet cho học viên:', email);
    });

    // 3. Gửi Email thông báo Admin (chạy nền)
    sendAdminNotification(registration).then((success) => {
      if (success) console.log('Đã gửi email thông báo Admin cho học viên:', email);
    });

    // Trả về dữ liệu để hiển thị Modal VietQR ở frontend
    return NextResponse.json({
      success: true,
      registration: {
        id: registration.id,
        name: registration.name,
        email: registration.email,
        phone: registration.phone,
        amount: registration.amount,
        transferCode: registration.transferCode,
      },
    });
  } catch (error) {
    console.error('Lỗi API Register:', error);
    return NextResponse.json({ error: 'Đã xảy ra lỗi khi đăng ký, vui lòng thử lại sau.' }, { status: 500 });
  }
}
