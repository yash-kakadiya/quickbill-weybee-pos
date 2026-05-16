import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decrypt } from './lib/auth';

const protectedRoutes = ['/', '/products', '/pos', '/orders', '/reports'];
const publicRoutes = ['/login'];

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  const isProtectedRoute = protectedRoutes.some((route) => path === route || path.startsWith(`${route}/`));
  const isPublicRoute = publicRoutes.includes(path);
  
  // Exclude API routes or static files from redirects for now, or handle them specifically
  if (path.startsWith('/_next') || path.startsWith('/api') || path.includes('.')) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get('session')?.value;
  let session = null;
  if (sessionCookie) {
    try {
      session = await decrypt(sessionCookie);
    } catch (e) {
      session = null;
    }
  }

  if (!session && isProtectedRoute && path !== '/login') {
    return NextResponse.redirect(new URL('/login', request.nextUrl));
  }

  if (session && isPublicRoute) {
    return NextResponse.redirect(new URL('/', request.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};
