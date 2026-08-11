import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('token')?.value;

  const rutasPublicas = ['/app/login', '/app/registro'];
  if (rutasPublicas.some((r) => pathname.startsWith(r))) {
    return NextResponse.next();
  }

  if (pathname.startsWith('/admin') || pathname.startsWith('/app')) {
    if (!token) {
      return NextResponse.redirect(new URL('/app/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/app/:path*'],
};