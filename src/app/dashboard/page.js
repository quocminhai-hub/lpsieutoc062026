import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import prisma from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import DashboardClient from './DashboardClient';

export default async function DashboardPage() {
  // Await cookies because in Next.js 15+ cookies() is async
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    redirect('/login');
  }

  const payload = await verifyToken(token);
  if (!payload) {
    redirect('/login');
  }

  // Khởi tạo các biến chứa dữ liệu cần truyền sang client
  let courses = [];
  let lectures = [];
  let students = [];
  let registrations = [];

  try {
    if (payload.role === 'ADMIN') {
      // 1. Admin: Lấy toàn bộ Khóa học kèm số lượng bài giảng
      courses = await prisma.course.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          lectures: {
            orderBy: { order: 'asc' },
          },
        },
      });

      // 2. Admin: Lấy toàn bộ Bài giảng
      lectures = await prisma.lecture.findMany({
        orderBy: { order: 'asc' },
        include: {
          course: {
            select: { title: true },
          },
        },
      });

      // 3. Admin: Lấy toàn bộ Học viên và khóa học tương ứng
      students = await prisma.user.findMany({
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

      // 4. Admin: Lấy toàn bộ đơn Đăng ký từ Landing Page
      registrations = await prisma.registration.findMany({
        orderBy: { createdAt: 'desc' },
      });
    } else {
      // Học viên thường: Chỉ lấy các khóa học học viên được phân quyền (enrollments)
      const enrollments = await prisma.enrollment.findMany({
        where: { userId: payload.id },
        include: {
          course: {
            include: {
              lectures: {
                orderBy: { order: 'asc' },
              },
            },
          },
        },
      });

      courses = enrollments.map((e) => e.course).filter(Boolean);
      // Lấy toàn bộ bài giảng của các khóa học học viên có quyền truy cập
      lectures = courses.flatMap((c) =>
        (c.lectures || []).map((l) => ({
          ...l,
          courseId: c.id,
          course: { title: c.title }
        }))
      );
    }
  } catch (err) {
    console.error('Lỗi truy vấn Database trong Dashboard Page:', err);
  }

  // Chuẩn bị payload thông tin user sạch để gửi cho client
  const user = {
    id: payload.id,
    name: payload.name,
    email: payload.email,
    role: payload.role,
  };

  return (
    <DashboardClient
      user={user}
      initialCourses={courses}
      initialLectures={lectures}
      initialStudents={students}
      initialRegistrations={registrations}
    />
  );
}
