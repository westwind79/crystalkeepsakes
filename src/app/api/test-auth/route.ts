import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()
    const testPassword = process.env.NEXT_PUBLIC_TEST_PASSWORD

    if (!testPassword || process.env.NEXT_PUBLIC_BASE_PATH !== '/test') {
      return NextResponse.json({ success: false, error: 'Not available' }, { status: 403 })
    }

    if (password === testPassword) {
      const response = NextResponse.json({ success: true })
      
      // Set authentication cookie
      response.cookies.set('test_auth', testPassword, {
        maxAge: 60 * 60 * 24, // 24 hours
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: '/'
      })
      
      return response
    }

    return NextResponse.json({ success: false, error: 'Invalid password' }, { status: 401 })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
