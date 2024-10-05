// components/Navbar.js
import Link from 'next/link';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export default function Navbar() {
  const { logout } = useContext(AuthContext);

  return (
    <nav className="navbar">
      <ul className="navbar-links">
        <li>
          <Link href="/daily-monitor">Daily Monitor</Link>
        </li>
        <li>
          <Link href="/month-monitor">Month Monitor</Link>
        </li>
        <li>
          <button onClick={logout}>Logout</button>
        </li>
      </ul>
    </nav>
  );
}
