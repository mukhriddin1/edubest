import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
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
      const msg = result.error?.detail || result.error?.message || 'Неверный email или пароль';
      setError(msg);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="text-3xl font-black text-green-600">EDU BEST</Link>
          <p className="text-gray-500 text-sm mt-1">Платформа подготовки к ОРТ 🇰🇬</p>
        </div>

        <div className="bg-white border border-green-100 rounded-3xl p-8 shadow-xl shadow-green-100">
          <h1 className="text-2xl font-black text-gray-900 mb-1">Добро пожаловать!</h1>
          <p className="text-gray-500 text-sm mb-6">Войди в свой аккаунт</p>

          {error && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-5 text-sm"
            >
              <span className="text-lg">⚠️</span>
              <span>{error}</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-gray-700 text-sm font-semibold mb-1.5 block">Email</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="w-full bg-gray-50 border-2 border-gray-200 focus:border-green-400 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:bg-white transition text-sm"
                placeholder="your@email.com" required
              />
            </div>
            <div>
              <label className="text-gray-700 text-sm font-semibold mb-1.5 block">Пароль</label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)}
                className="w-full bg-gray-50 border-2 border-gray-200 focus:border-green-400 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:bg-white transition text-sm"
                placeholder="••••••••" required
              />
            </div>
            <button
              type="submit" disabled={isLoading}
              className="w-full bg-green-500 hover:bg-green-400 text-white font-bold py-3.5 rounded-xl transition disabled:opacity-50 shadow-lg shadow-green-200 text-sm"
            >
              {isLoading ? '⏳ Загрузка...' : 'Войти в аккаунт →'}
            </button>
          </form>

          <div className="mt-5 space-y-2 text-center">
            <Link to="/forgot-password" className="text-green-600 text-sm hover:underline block">Забыл пароль?</Link>
            <p className="text-gray-500 text-sm">
              Нет аккаунта?{' '}
              <Link to="/register" className="text-green-600 font-semibold hover:underline">Зарегистрироваться</Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
