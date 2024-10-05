// components/Layout.js
import { useContext, useEffect } from 'react';
import Navbar from './Navbar';
import { AuthContext } from '../context/AuthContext';
import { useRouter } from 'next/router';

export default function Layout({ children }) {
  const { user } = useContext(AuthContext);
  const router = useRouter();

  useEffect(() => {
    if (!user && router.pathname !== '/login') {
      router.push('/login');
    } else if (user && router.pathname === '/login') {
      router.push('/daily-monitor'); // Redirect to Daily Monitor page
    }
  }, [user, router]);

  if ((!user && router.pathname !== '/login') || (user && router.pathname === '/login')) {
    return null; // Prevent rendering until redirect is complete
  }

  return (
    <>
      {user && <Navbar />}
      <main>{children}</main>
    </>
  );
}
