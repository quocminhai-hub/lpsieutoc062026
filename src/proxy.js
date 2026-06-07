import { NextResponse } from 'next/server';
import { verifyToken } from './lib/auth';

export async function proxy(request) {
  const { pathname } = request.nextUrl;
  const tokenCookie = request.cookies.get('token');
  const token = tokenCookie?.value;

  // Protect dashboard page
  if (pathname === '/dashboard') {
    if (!token) {
      const loginUrl = new URL('/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
    const payload = await verifyToken(token);
    if (!payload) {
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('token');
      return response;
    }
  }

  // Protect admin api routes
  if (pathname.startsWith('/api/admin')) {
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized: No token provided' }, { status: 401 });
    }
    const payload = await verifyToken(token);
    if (!payload || payload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }
  }

  // Redirect to dashboard if logged in and trying to access login page
  if (pathname === '/login') {
    if (token) {
      const payload = await verifyToken(token);
      if (payload) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard', '/login', '/api/admin/:path*'],
};
