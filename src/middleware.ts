import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Only apply password protection in test environment
  const isTestEnvironment = process.env.NEXT_PUBLIC_BASE_PATH === '/test'
  const testPassword = process.env.NEXT_PUBLIC_TEST_PASSWORD
  
  if (!isTestEnvironment || !testPassword) {
    return NextResponse.next()
  }
  
  // Check if user has valid authentication cookie
  const authCookie = request.cookies.get('test_auth')
  
  if (authCookie?.value === testPassword) {
    return NextResponse.next()
  }
  
  // Check for password in query parameter (for initial access)
  const url = new URL(request.url)
  const password = url.searchParams.get('password')
  
  if (password === testPassword) {
    const response = NextResponse.next()
    // Set cookie that expires in 24 hours
    response.cookies.set('test_auth', testPassword, {
      maxAge: 60 * 60 * 24, // 24 hours
      httpOnly: true,
      secure: true,
      sameSite: 'lax'
    })
    return response
  }
  
  // Redirect to password page
  if (!request.nextUrl.pathname.startsWith('/test-login')) {
    const loginUrl = new URL('/test-login', request.url)
    loginUrl.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }
  
  return NextResponse.next()
}

// Apply middleware to all routes except API, static files, and login page
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - test-login (password page)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|test-login).*)',
  ],
}
