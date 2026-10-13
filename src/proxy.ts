import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function rolDelToken(token: string): string | null {
  try {
    const payload = token.split('.')[1];
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(payload.length / 4) * 4, '='));
    return JSON.parse(json)?.rol ?? null;
  } catch {
    return null;
  }
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('token')?.value;

  const rutasPublicas = [
    '/app/login',
    '/app/registro',
    '/app/recuperar-password',
    '/app/resetear-password',
  ];
  if (rutasPublicas.some((r) => pathname.startsWith(r))) {
    return NextResponse.next();
  }

  if (pathname.startsWith('/admin') || pathname.startsWith('/app')) {
    if (!token) {
      return NextResponse.redirect(new URL('/app/login', request.url));
    }
  }

  // ⭐ /admin solo para rol admin. Aquí solo se lee el rol del token para no pintar el panel
  // a quien no lo es; la seguridad real está en el backend (RolesGuard en cada ruta de admin).
  if (pathname.startsWith('/admin') && token && rolDelToken(token) !== 'admin') {
    return NextResponse.redirect(new URL('/app/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/app/:path*'],
};