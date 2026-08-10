import { redirect } from 'next/navigation';
import { getSession, hasKnownDeviceCookie } from '@/lib/server/session';

export default async function Home() {
  const session = await getSession();

  if (session) redirect('/app');

  redirect(hasKnownDeviceCookie() ? '/login' : '/register');
}
