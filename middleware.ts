
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// List of paths to protect
const protectedPaths = [
    '/admin',
    '/admin/menu',
    '/admin/inventario',
    '/admin/cocina',
    '/admin/domicilio',
    '/admin/recoger',
    '/admin/horarios',
    // Add other specific paths or patterns if needed
];

// Define paths that should bypass the middleware check entirely
const publicPaths = [
    '/login', // Allow access to the login page
    // Add other public paths like '/', '/api/auth', etc. if needed
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the path is public
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next(); // Allow access to public paths
  }

  // Check if the path is protected
  const isProtected = protectedPaths.some(path => pathname.startsWith(path));

  if (isProtected) {
    // Try to get a common Firebase auth cookie 
    // (The actual name might vary, e.g., '__session' if using session cookies)
    const tokenCookie = request.cookies.get('firebaseIdToken'); // Example name, adjust if needed
    
    if (!tokenCookie) {
        console.log(`Middleware: No auth cookie found for ${pathname}. Redirecting to login.`);
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirectedFrom', pathname); // Pass original path
        return NextResponse.redirect(loginUrl);
    }
     // Basic check passed, allow access. Role checks would happen client/server-side.
     console.log(`Middleware: Auth cookie found for ${pathname}. Allowing.`);
  }

  // Allow other requests (like homepage '/', API routes not explicitly excluded) 
  return NextResponse.next();
}

// Configure the middleware to run on specific paths
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images (public images folder)
     * - api (API routes - assuming auth handled separately or publicly accessible initially)
     */
    '/((?!_next/static|_next/image|favicon.ico|images|api).*)',
  ],
}

