import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/axios';

export default function RegisterPage() {
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/register/', form);
      navigate('/verify?email=' + form.email);
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка регистрации');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8">
        <h1 className="text-2xl font-bold text-white mb-2">Регистрация</h1>
        <p className="text-slate-400 text-sm mb-6">Создай аккаунт бесплатно</p>
        {error && <p className="text-red-400 text-sm mb-4 bg-red-400/10 px-3 py-2 rounded-lg">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-300 text-sm mb-1 block">Имя</label>
              <input type="text" value={form.first_name} onChange={e => setForm({...form, first_name: e.target.value})}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-400"
                placeholder="Мухриддин" required />
            </div>
            <div>
              <label className="text-slate-300 text-sm mb-1 block">Фамилия</label>
              <input type="text" value={form.last_name} onChange={e => setForm({...form, last_name: e.target.value})}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-400"
                placeholder="Иванов" required />
            </div>
          </div>
          <div>
            <label className="text-slate-300 text-sm mb-1 block">Email</label>
            <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-400"
              placeholder="your@email.com" required />
          </div>
          <div>
            <label className="text-slate-300 text-sm mb-1 block">Пароль</label>
            <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-400"
              placeholder="Минимум 8 символов" required minLength={8} />
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3 rounded-xl transition disabled:opacity-50">
            {loading ? 'Загрузка...' : 'Создать аккаунт'}
          </button>
        </form>
        <p className="mt-4 text-center text-slate-500 text-sm">
          Уже есть аккаунт? <Link to="/login" className="text-amber-400 hover:underline">Войти</Link>
        </p>
      </div>
    </div>
  );
}
