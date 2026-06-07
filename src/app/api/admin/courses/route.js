import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

// Lấy danh sách khóa học
export async function GET() {
  try {
    const courses = await prisma.course.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { lectures: true },
        },
      },
    });
    return NextResponse.json({ success: true, courses });
  } catch (error) {
    console.error('Lỗi GET Admin Courses:', error);
    return NextResponse.json({ error: 'Đã xảy ra lỗi khi lấy danh sách khóa học' }, { status: 500 });
  }
}

// Tạo khóa học mới
export async function POST(request) {
  try {
    const body = await request.json();
    const { title, description } = body;

    if (!title) {
      return NextResponse.json({ error: 'Tên khóa học là bắt buộc' }, { status: 400 });
    }

    const course = await prisma.course.create({
      data: { title, description },
    });

    return NextResponse.json({ success: true, course });
  } catch (error) {
    console.error('Lỗi POST Admin Courses:', error);
    return NextResponse.json({ error: 'Đã xảy ra lỗi khi tạo khóa học' }, { status: 500 });
  }
}

// Cập nhật khóa học
export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, title, description } = body;

    if (!id || !title) {
      return NextResponse.json({ error: 'ID và Tên khóa học là bắt buộc' }, { status: 400 });
    }

    const course = await prisma.course.update({
      where: { id },
      data: { title, description },
    });

    return NextResponse.json({ success: true, course });
  } catch (error) {
    console.error('Lỗi PUT Admin Courses:', error);
    return NextResponse.json({ error: 'Đã xảy ra lỗi khi cập nhật khóa học' }, { status: 500 });
  }
}

// Xóa khóa học
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID khóa học là bắt buộc' }, { status: 400 });
    }

    await prisma.course.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Đã xóa khóa học thành công' });
  } catch (error) {
    console.error('Lỗi DELETE Admin Courses:', error);
    return NextResponse.json({ error: 'Đã xảy ra lỗi khi xóa khóa học' }, { status: 500 });
  }
}
