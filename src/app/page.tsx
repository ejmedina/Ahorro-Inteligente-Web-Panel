import { redirect } from 'next/navigation';

export default function Home() {
  // Simple redirect to protected app logic relying on AuthContext redirecting to /login if needed
  redirect('/login');
}
