import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/db';
import { sendStudentCredentials } from '@/lib/mailer';

// Lấy danh sách học viên và đơn đăng ký
export async function GET() {
  try {
    // Lấy tất cả user có role STUDENT
    const students = await prisma.user.findMany({
      where: { role: 'STUDENT' },
      orderBy: { createdAt: 'desc' },
      include: {
        enrollments: {
          include: {
            course: {
              select: { id: true, title: true },
            },
          },
        },
      },
    });

    // Lấy danh sách đăng ký
    const registrations = await prisma.registration.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, students, registrations });
  } catch (error) {
    console.error('Lỗi GET Admin Students:', error);
    return NextResponse.json({ error: 'Đã xảy ra lỗi khi lấy danh sách học viên' }, { status: 500 });
  }
}

// Cấp tài khoản học viên mới (hoặc cập nhật)
export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email, password, courseIds } = body; // courseIds là một mảng ID các khóa học

    if (!name || !email) {
      return NextResponse.json({ error: 'Họ tên và Email là bắt buộc' }, { status: 400 });
    }

    // Mật khẩu ngẫu nhiên nếu không nhập
    const plainPassword = password || Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    // Sử dụng transaction để đảm bảo tính toàn vẹn dữ liệu
    const result = await prisma.$transaction(async (tx) => {
      // 1. Tìm hoặc tạo User
      let user = await tx.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (user) {
        // Cập nhật thông tin user hiện tại
        user = await tx.user.update({
          where: { id: user.id },
          data: {
            name,
            password: hashedPassword, // Reset mật khẩu mới
          },
        });
      } else {
        // Tạo user mới
        user = await tx.user.create({
          data: {
            name,
            email: email.toLowerCase(),
            password: hashedPassword,
            role: 'STUDENT',
          },
        });
      }

      // 2. Cập nhật phân quyền khóa học (xóa cũ, tạo mới)
      await tx.enrollment.deleteMany({
        where: { userId: user.id },
      });

      if (courseIds && courseIds.length > 0) {
        await tx.enrollment.createMany({
          data: courseIds.map((courseId) => ({
            userId: user.id,
            courseId,
          })),
        });
      }

      // 3. Cập nhật trạng thái trong bảng Registration sang COMPLETED nếu có
      await tx.registration.updateMany({
        where: { email: email.toLowerCase() },
        data: { status: 'COMPLETED' },
      });

      return { user, plainPassword };
    });

    console.log(`Đã cấp tài khoản cho ${email} thành công.`);

    // 4. Gửi email tài khoản đăng nhập cho học viên (chạy nền)
    sendStudentCredentials(email.toLowerCase(), name, result.plainPassword).then((success) => {
      if (success) console.log('Đã gửi email thông tin tài khoản cho học viên:', email);
    });

    return NextResponse.json({
      success: true,
      message: 'Cấp tài khoản và gửi email thành công',
      user: result.user,
    });
  } catch (error) {
    console.error('Lỗi POST Admin Students:', error);
    return NextResponse.json({ error: 'Đã xảy ra lỗi khi cấp tài khoản học viên' }, { status: 500 });
  }
}

// Xóa học viên
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID học viên là bắt buộc' }, { status: 400 });
    }

    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Đã xóa tài khoản học viên thành công' });
  } catch (error) {
    console.error('Lỗi DELETE Admin Students:', error);
    return NextResponse.json({ error: 'Đã xảy ra lỗi khi xóa học viên' }, { status: 500 });
  }
}
