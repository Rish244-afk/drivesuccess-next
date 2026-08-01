import { NextResponse } from 'next/server';
import { logoutAction } from '@/actions/auth';
import { cookies } from 'next/headers';

export async function POST() {
  await logoutAction();
  
  const cookieStore = cookies();
  cookieStore.delete('auth_token');
  cookieStore.delete('admin_auth_token');

  const response = NextResponse.json({ success: true, message: 'Logged out successfully' });
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  
  return response;
}
