import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth';

export default async function ProfilePage() {
  const session = await getServerSession();

  if (!session) {
    redirect('/auth/login?from=/dashboard');
  }

  if (session.role === 'ADMIN') {
    redirect('/admin');
  }

  redirect('/dashboard');
}
