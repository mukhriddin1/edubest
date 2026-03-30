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
      setError(typeof msg === 'string' ? msg : 'Неверный email или пароль');
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '12px',
    border: '2px solid #e2e8f0',
    fontSize: '15px',
    outline: 'none',
    background: '#f8fafc',
    color: '#0f172a',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
    display: 'block',
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ width: '100%', maxWidth: 420 }}>

        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Link to="/" style={{ fontSize: 28, fontWeight: 900, color: '#16a34a', textDecoration: 'none' }}>EDU BEST 🇰🇬</Link>
          <p style={{ color: '#64748b', fontSize: 14, marginTop: 4 }}>Платформа подготовки к ОРТ</p>
        </div>

        <div style={{ background: '#fff', border: '1px solid #bbf7d0', borderRadius: 24, padding: 32, boxShadow: '0 20px 60px rgba(34,197,94,0.1)' }}>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', marginBottom: 4 }}>Добро пожаловать!</h1>
          <p style={{ color: '#64748b', fontSize: 14, marginBottom: 24 }}>Войди в свой аккаунт</p>

          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '12px 16px', borderRadius: 12, marginBottom: 20, fontSize: 14 }}>
              ⚠️ {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = '#22c55e'}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Пароль</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = '#22c55e'}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%', padding: '14px', background: isLoading ? '#86efac' : '#22c55e',
                color: '#fff', fontWeight: 800, fontSize: 15, border: 'none', borderRadius: 14,
                cursor: isLoading ? 'not-allowed' : 'pointer', transition: 'background 0.2s',
                boxShadow: '0 4px 20px rgba(34,197,94,0.3)',
              }}
            >
              {isLoading ? '⏳ Загрузка...' : 'Войти в аккаунт →'}
            </button>
          </form>

          <div style={{ marginTop: 20, textAlign: 'center' }}>
            <Link to="/forgot-password" style={{ color: '#16a34a', fontSize: 14, display: 'block', marginBottom: 8 }}>Забыл пароль?</Link>
            <p style={{ color: '#64748b', fontSize: 14 }}>
              Нет аккаунта?{' '}
              <Link to="/register" style={{ color: '#16a34a', fontWeight: 700 }}>Зарегистрироваться</Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
