import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/db';
import { signToken } from '@/lib/auth';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email và mật khẩu là bắt buộc' }, { status: 400 });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return NextResponse.json({ error: 'Email hoặc mật khẩu không chính xác' }, { status: 401 });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Email hoặc mật khẩu không chính xác' }, { status: 401 });
    }

    // Generate JWT token
    const token = await signToken({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    // Create response and set cookie
    const response = NextResponse.json({
      success: true,
      user: {
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

    response.cookies.set({
      name: 'token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60, // 7 ngày
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Lỗi API Login:', error);
    return NextResponse.json({ error: 'Đã xảy ra lỗi hệ thống' }, { status: 500 });
  }
}
