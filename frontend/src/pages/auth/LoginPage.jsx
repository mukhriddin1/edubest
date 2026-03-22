import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const result = await login({ email, password });
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError('Неверный email или пароль');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8">
        <h1 className="text-2xl font-bold text-white mb-2">Вход в EDU BEST</h1>
        <p className="text-slate-400 text-sm mb-6">Введи свои данные для входа</p>
        {error && <p className="text-red-400 text-sm mb-4 bg-red-400/10 px-3 py-2 rounded-lg">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-slate-300 text-sm mb-1 block">Email</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-400"
              placeholder="your@email.com" required
            />
          </div>
          <div>
            <label className="text-slate-300 text-sm mb-1 block">Пароль</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-400"
              placeholder="••••••••" required
            />
          </div>
          <button
            type="submit" disabled={isLoading}
            className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3 rounded-xl transition disabled:opacity-50"
          >
            {isLoading ? 'Загрузка...' : 'Войти'}
          </button>
        </form>
        <div className="mt-4 text-center space-y-2">
          <Link to="/forgot-password" className="text-amber-400 text-sm hover:underline block">Забыл пароль?</Link>
          <p className="text-slate-500 text-sm">Нет аккаунта? <Link to="/register" className="text-amber-400 hover:underline">Зарегистрироваться</Link></p>
        </div>
      </div>
    </div>
  );
}
