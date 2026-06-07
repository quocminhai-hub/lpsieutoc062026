import { google } from 'googleapis';

export async function appendToSheet(data) {
  try {
    const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY;
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    if (!clientEmail || !privateKey || !spreadsheetId) {
      console.warn('CẢNH BÁO: Thiếu cấu hình Google Sheets trong .env. Bỏ qua ghi Sheet.');
      return false;
    }

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: clientEmail,
        private_key: privateKey.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    
    // Rows to append: [Thời gian, Họ tên, Email, Số điện thoại, Số tiền, Nội dung chuyển khoản, Trạng thái]
    const values = [
      [
        new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
        data.name,
        data.email,
        data.phone,
        data.amount.toLocaleString('vi-VN') + 'đ',
        data.transferCode,
        data.status || 'PENDING',
      ],
    ];

    const range = process.env.GOOGLE_SHEET_RANGE || 'Sheet1!A:G';

    const response = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values,
      },
    });

    console.log('Đã ghi thành công vào Google Sheet:', response.status);
    return true;
  } catch (error) {
    console.error('Lỗi khi ghi dữ liệu vào Google Sheet:', error);
    return false;
  }
}
