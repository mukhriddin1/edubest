import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

export default function Layout({ children }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <nav className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/dashboard" className="text-amber-400 font-black text-lg">EDU BEST</Link>
          <div className="flex items-center gap-4 text-sm">
            <Link to="/tests" className="text-slate-400 hover:text-white transition">Тесты</Link>
            <Link to="/leaderboard" className="text-slate-400 hover:text-white transition">Топ</Link>
            <Link to="/profile" className="text-slate-400 hover:text-white transition">{user?.first_name}</Link>
            <button onClick={handleLogout} className="text-slate-500 hover:text-white transition">Выйти</button>
          </div>
        </div>
      </nav>
      <main>{children}</main>
    </div>
  );
}
