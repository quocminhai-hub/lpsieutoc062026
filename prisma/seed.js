const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
const bcrypt = require('bcryptjs');

const adapter = new PrismaBetterSqlite3({
  url: "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  // 1. Create Default Admin
  const adminEmail = "admin@luyenai.io.vn";
  const adminPassword = "admin123"; // Mật khẩu mặc định
  const hashedAdminPassword = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: "Quốc Minh AI (Admin)",
      password: hashedAdminPassword,
      role: "ADMIN",
    },
  });
  console.log("Admin account created:", adminEmail, "/ password:", adminPassword);

  // 2. Create Default Student for testing
  const studentEmail = "namsadoma@gmail.com";
  const studentPassword = "student123";
  const hashedStudentPassword = await bcrypt.hash(studentPassword, 10);

  const student = await prisma.user.upsert({
    where: { email: studentEmail },
    update: {},
    create: {
      email: studentEmail,
      name: "Nam Sadoma",
      password: hashedStudentPassword,
      role: "STUDENT",
    },
  });
  console.log("Student account created:", studentEmail, "/ password:", studentPassword);

  // 3. Create Sample Course
  const course = await prisma.course.create({
    data: {
      title: "Khóa Học PageForge AI - Landing Page Siêu Tốc",
      description: "Học sinh dùng AI tạo landing page bán hàng triệu đô trong 60 giây.",
    },
  });
  console.log("Sample course created:", course.title);

  // 4. Enroll Student in the Course
  await prisma.enrollment.create({
    data: {
      userId: student.id,
      courseId: course.id,
    },
  });
  console.log("Enrolled student in course.");

  // 5. Create Sample Lectures
  const lectures = [
    {
      title: "Bài 1: Tổng quan về PageForge AI",
      description: "Giới thiệu về công cụ và các tính năng nổi bật.",
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      order: 1,
    },
    {
      title: "Bài 2: Cách viết prompt hiệu quả như AI",
      description: "Công thức 5 lớp tạo copy landing page.",
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      order: 2,
    },
    {
      title: "Bài 3: Thiết kế giao diện chuyển đổi tối ưu",
      description: "Bố cục, màu sắc, typography cho landing page.",
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      order: 3,
    },
    {
      title: "Bài 4: Tích hợp Payment, Webhook, Email",
      description: "Kết nối form và thiết lập email tự động.",
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      order: 4,
    },
    {
      title: "Bài 5: Chạy quảng cáo & tối ưu chuyển đổi",
      description: "Cách scale landing page lên 7 con số.",
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      order: 5,
    },
  ];

  for (const lecture of lectures) {
    await prisma.lecture.create({
      data: {
        ...lecture,
        courseId: course.id,
      },
    });
  }
  console.log("Sample lectures created.");

  console.log("Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
