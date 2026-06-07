import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

// Lấy danh sách bài giảng (có thể lọc theo courseId)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');

    const filter = courseId ? { courseId } : {};

    const lectures = await prisma.lecture.findMany({
      where: filter,
      orderBy: { order: 'asc' },
      include: {
        course: {
          select: { title: true },
        },
      },
    });

    return NextResponse.json({ success: true, lectures });
  } catch (error) {
    console.error('Lỗi GET Admin Lectures:', error);
    return NextResponse.json({ error: 'Đã xảy ra lỗi khi lấy danh sách bài giảng' }, { status: 500 });
  }
}

// Thêm bài giảng mới
export async function POST(request) {
  try {
    const body = await request.json();
    const { title, description, videoUrl, courseId, order } = body;

    if (!title || !videoUrl || !courseId) {
      return NextResponse.json({ error: 'Tên bài giảng, Link video và Khóa học là bắt buộc' }, { status: 400 });
    }

    // Đếm số lượng bài giảng hiện tại để tự động tính order nếu chưa truyền
    let finalOrder = order;
    if (finalOrder === undefined || finalOrder === null) {
      const count = await prisma.lecture.count({
        where: { courseId },
      });
      finalOrder = count + 1;
    }

    const lecture = await prisma.lecture.create({
      data: {
        title,
        description,
        videoUrl,
        courseId,
        order: parseInt(finalOrder),
      },
    });

    return NextResponse.json({ success: true, lecture });
  } catch (error) {
    console.error('Lỗi POST Admin Lectures:', error);
    return NextResponse.json({ error: 'Đã xảy ra lỗi khi thêm bài giảng' }, { status: 500 });
  }
}

// Cập nhật bài giảng
export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, title, description, videoUrl, courseId, order } = body;

    if (!id || !title || !videoUrl || !courseId) {
      return NextResponse.json({ error: 'Thiếu các trường thông tin bắt buộc' }, { status: 400 });
    }

    const lecture = await prisma.lecture.update({
      where: { id },
      data: {
        title,
        description,
        videoUrl,
        courseId,
        order: parseInt(order),
      },
    });

    return NextResponse.json({ success: true, lecture });
  } catch (error) {
    console.error('Lỗi PUT Admin Lectures:', error);
    return NextResponse.json({ error: 'Đã xảy ra lỗi khi cập nhật bài giảng' }, { status: 500 });
  }
}

// Xóa bài giảng
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID bài giảng là bắt buộc' }, { status: 400 });
    }

    await prisma.lecture.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Đã xóa bài giảng thành công' });
  } catch (error) {
    console.error('Lỗi DELETE Admin Lectures:', error);
    return NextResponse.json({ error: 'Đã xảy ra lỗi khi xóa bài giảng' }, { status: 500 });
  }
}
