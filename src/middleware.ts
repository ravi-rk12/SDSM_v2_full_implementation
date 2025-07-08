// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/firebase/config'; // Import the Firebase auth instance (server-side)

// Regex for paths that do NOT require authentication
const publicPaths = [
  '/login',
  '/api/auth/login', // If you have API routes for auth
  '/', // <-- TEMPORARILY ADD THIS LINE
  // Add other public paths like forgot password, signup if applicable
];

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Check if the current path is a public path
  const isPublicPath = publicPaths.some(publicPath => {
    if (publicPath.endsWith('/')) {
      return path === publicPath || path.startsWith(publicPath);
    }
    return path === publicPath;
  });

  // Note: Direct Firebase Auth client SDK calls like onAuthStateChanged don't work reliably in Edge Middleware.
  // For proper server-side authentication with Next.js middleware, you'd typically use
  // Firebase Admin SDK to verify session cookies.
  // However, for simplicity and typical Firebase client-side auth in Next.js App Router,
  // we'll rely on client-side redirects for now and enhance middleware later.
  // This middleware primarily handles redirection for already authenticated users from /login
  // and basic protection for /

  // THIS IS A SIMPLIFIED MIDDLEWARE FOR NOW.
  // For robust server-side protection, especially against API routes,
  // Firebase Admin SDK with session cookies is the recommended approach.

  const isLoggedIn = request.cookies.has('firebase_token_name'); // Placeholder: This will always be false for now

  // Basic redirection logic:
  // Since we've added '/' to publicPaths, this condition won't trigger for '/' now.
  if (isPublicPath && isLoggedIn) { // If trying to access public path (like /login) but already logged in
    return NextResponse.redirect(new URL('/', request.nextUrl)); // Redirect to home/dashboard
  }

  // This condition will now fail for '/' because it's now a public path.
  if (!isPublicPath && !isLoggedIn) { // If trying to access protected path but not logged in
    return NextResponse.redirect(new URL('/login', request.nextUrl)); // Redirect to login
  }

  return NextResponse.next();
}

export const config = {
  // Match all paths except API routes, static files, and _next/static/
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};