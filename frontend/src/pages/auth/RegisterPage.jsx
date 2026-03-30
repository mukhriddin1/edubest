import { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import useAuthStore from '../../store/authStore';

export default function RegisterPage() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setTokens, setUser, fetchProfile } = useAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!firstName.trim()) errs.firstName = 'Введи имя';
    if (!lastName.trim()) errs.lastName = 'Введи фамилию';
    if (!email.includes('@')) errs.email = 'Некорректный email';
    if (password.length < 8) errs.password = 'Минимум 8 символов';
    if (password !== confirmPassword) errs.confirmPassword = 'Пароли не совпадают';
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setLoading(true);
    setErrors({});
    try {
      const { data } = await api.post('/auth/register/', {
        first_name: firstName,
        last_name: lastName,
        email,
        password,
      });
      if (data.access) {
        setTokens(data.access, data.refresh);
        if (data.user) setUser(data.user);
        else await fetchProfile();
        navigate('/dashboard');
      } else {
        navigate('/login');
      }
    } catch (err) {
      const errData = err.response?.data;
      if (errData?.errors) setErrors(errData.errors);
      else setErrors({ general: errData?.message || 'Ошибка регистрации' });
    } finally {
      setLoading(false);
    }
  };

  const inp = (hasErr) => ({
    width: '100%', padding: '12px 14px', borderRadius: 10,
    border: `2px solid ${hasErr ? '#fca5a5' : '#d1fae5'}`,
    fontSize: 15, outline: 'none', background: '#fff',
    color: '#111', boxSizing: 'border-box', fontFamily: 'inherit',
  });

  return (
    <div style={{ minHeight: '100vh', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ width: '100%', maxWidth: 420 }}>

        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Link to="/" style={{ fontSize: 26, fontWeight: 900, color: '#16a34a', textDecoration: 'none' }}>EDU BEST 🇰🇬</Link>
          <p style={{ color: '#64748b', fontSize: 13, marginTop: 4 }}>Платформа подготовки к ОРТ</p>
        </div>

        <div style={{ background: '#fff', borderRadius: 20, padding: 28, boxShadow: '0 8px 40px rgba(0,0,0,0.08)' }}>
          <h1 style={{ fontSize: 22, fontWeight: 900, marginBottom: 4, color: '#0f172a' }}>Создай аккаунт</h1>
          <p style={{ color: '#64748b', fontSize: 13, marginBottom: 20 }}>Бесплатно · Быстро · Без подтверждения</p>

          {errors.general && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '10px 14px', borderRadius: 10, marginBottom: 16, fontSize: 13 }}>
              ⚠️ {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} autoComplete="off">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Имя</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  placeholder="Мухриддин"
                  style={inp(errors.firstName)}
                />
                {errors.firstName && <p style={{ color: '#dc2626', fontSize: 11, marginTop: 3 }}>{errors.firstName}</p>}
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Фамилия</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  placeholder="Иванов"
                  style={inp(errors.lastName)}
                />
                {errors.lastName && <p style={{ color: '#dc2626', fontSize: 11, marginTop: 3 }}>{errors.lastName}</p>}
              </div>
            </div>

            <div style={{ marginBottom: 10 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                style={inp(errors.email)}
              />
              {errors.email && <p style={{ color: '#dc2626', fontSize: 11, marginTop: 3 }}>{errors.email}</p>}
            </div>

            <div style={{ marginBottom: 10 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Пароль</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Минимум 8 символов"
                style={inp(errors.password)}
              />
              {errors.password && <p style={{ color: '#dc2626', fontSize: 11, marginTop: 3 }}>{errors.password}</p>}
            </div>

            <div style={{ marginBottom: 18 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Повтори пароль</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                style={inp(errors.confirmPassword)}
              />
              {errors.confirmPassword && <p style={{ color: '#dc2626', fontSize: 11, marginTop: 3 }}>{errors.confirmPassword}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '14px', background: '#22c55e',
                color: '#fff', fontWeight: 800, fontSize: 15,
                border: 'none', borderRadius: 12, cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1, fontFamily: 'inherit',
              }}
            >
              {loading ? '⏳ Создаём...' : 'Создать аккаунт →'}
            </button>
          </form>

          <p style={{ marginTop: 16, textAlign: 'center', color: '#64748b', fontSize: 13 }}>
            Уже есть аккаунт?{' '}
            <Link to="/login" style={{ color: '#16a34a', fontWeight: 700 }}>Войти</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
