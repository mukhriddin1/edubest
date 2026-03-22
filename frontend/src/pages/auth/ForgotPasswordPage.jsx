import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await api.post('/auth/password-reset/', { email });
    setSent(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8">
        <h1 className="text-2xl font-bold text-white mb-2">Сброс пароля</h1>
        {sent ? (
          <p className="text-emerald-400">Код отправлен на {email}</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 mt-6">
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-400"
              placeholder="your@email.com" required />
            <button type="submit" className="w-full bg-amber-500 text-slate-950 font-bold py-3 rounded-xl">Отправить код</button>
          </form>
        )}
        <Link to="/login" className="text-amber-400 text-sm mt-4 block text-center">← Назад</Link>
      </div>
    </div>
  );
}
