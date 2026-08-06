import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { state } = await req.json();

    if (!state) {
      return NextResponse.json({ success: false, error: 'State parameter is required' }, { status: 400 });
    }

    const response = NextResponse.json({ success: true });

    // Set secure HttpOnly cookie with 10 minute expiration
    response.cookies.set('oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/api/auth/google',
      maxAge: 10 * 60, // 10 minutes
    });

    return response;
  } catch (error) {
    console.error('Error setting OAuth state cookie:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
