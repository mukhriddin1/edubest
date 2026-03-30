import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../../api/axios';
import useAuthStore from '../../store/authStore';

export default function RegisterPage() {
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', password: '', confirm_password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setTokens, setUser, fetchProfile } = useAuthStore();

  const update = (field, val) => {
    setForm(f => ({ ...f, [field]: val }));
    if (errors[field]) setErrors(e => ({ ...e, [field]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.first_name.trim()) errs.first_name = 'Введи имя';
    if (!form.last_name.trim()) errs.last_name = 'Введи фамилию';
    if (!form.email.includes('@')) errs.email = 'Некорректный email';
    if (form.password.length < 8) errs.password = 'Минимум 8 символов';
    if (form.password !== form.confirm_password) errs.confirm_password = 'Пароли не совпадают';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setLoading(true);
    setErrors({});
    try {
      const { data } = await api.post('/auth/register/', {
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        password: form.password,
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
      else setErrors({ general: errData?.message || 'Ошибка регистрации. Попробуй снова.' });
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (hasError) => ({
    width: '100%',
    padding: '12px 16px',
    borderRadius: '12px',
    border: `2px solid ${hasError ? '#fca5a5' : '#e2e8f0'}`,
    fontSize: '15px',
    outline: 'none',
    background: hasError ? '#fef2f2' : '#f8fafc',
    color: '#0f172a',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
    display: 'block',
  });

  const Field = ({ label, field, type = 'text', placeholder }) => (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 5 }}>{label}</label>
      <input
        type={type}
        value={form[field]}
        onChange={e => update(field, e.target.value)}
        placeholder={placeholder}
        style={inputStyle(!!errors[field])}
        onFocus={e => { e.target.style.borderColor = '#22c55e'; e.target.style.background = '#fff'; }}
        onBlur={e => { e.target.style.borderColor = errors[field] ? '#fca5a5' : '#e2e8f0'; e.target.style.background = errors[field] ? '#fef2f2' : '#f8fafc'; }}
      />
      {errors[field] && (
        <p style={{ color: '#dc2626', fontSize: 12, marginTop: 4 }}>⚠️ {errors[field]}</p>
      )}
    </div>
  );

  const passChecks = [
    { ok: form.password.length >= 8, text: 'Минимум 8 символов' },
    { ok: /[A-Za-z]/.test(form.password), text: 'Содержит буквы' },
    { ok: /[0-9]/.test(form.password), text: 'Содержит цифры' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ width: '100%', maxWidth: 440 }}>

        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Link to="/" style={{ fontSize: 28, fontWeight: 900, color: '#16a34a', textDecoration: 'none' }}>EDU BEST 🇰🇬</Link>
          <p style={{ color: '#64748b', fontSize: 14, marginTop: 4 }}>Платформа подготовки к ОРТ</p>
        </div>

        <div style={{ background: '#fff', border: '1px solid #bbf7d0', borderRadius: 24, padding: 32, boxShadow: '0 20px 60px rgba(34,197,94,0.1)' }}>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', marginBottom: 4 }}>Создай аккаунт</h1>
          <p style={{ color: '#64748b', fontSize: 14, marginBottom: 24 }}>Регистрация бесплатная — 1 минута</p>

          {errors.general && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '12px 16px', borderRadius: 12, marginBottom: 16, fontSize: 14 }}>
              ⚠️ {errors.general}
            </motion.div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 0 }}>
              <Field label="Имя" field="first_name" placeholder="Мухриддин" />
              <Field label="Фамилия" field="last_name" placeholder="Иванов" />
            </div>
            <Field label="Email" field="email" type="email" placeholder="your@email.com" />
            <Field label="Пароль" field="password" type="password" placeholder="Минимум 8 символов" />

            {/* Password strength */}
            {form.password && (
              <div style={{ marginBottom: 14, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {passChecks.map(c => (
                  <span key={c.text} style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: c.ok ? '#dcfce7' : '#f1f5f9', color: c.ok ? '#16a34a' : '#94a3b8', fontWeight: 600 }}>
                    {c.ok ? '✓' : '○'} {c.text}
                  </span>
                ))}
              </div>
            )}

            <Field label="Повтори пароль" field="confirm_password" type="password" placeholder="••••••••" />

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '14px', background: loading ? '#86efac' : '#22c55e',
                color: '#fff', fontWeight: 800, fontSize: 15, border: 'none', borderRadius: 14,
                cursor: loading ? 'not-allowed' : 'pointer', marginTop: 4,
                boxShadow: '0 4px 20px rgba(34,197,94,0.3)',
              }}
            >
              {loading ? '⏳ Создаём аккаунт...' : 'Создать аккаунт →'}
            </button>
          </form>

          <p style={{ marginTop: 20, textAlign: 'center', color: '#64748b', fontSize: 14 }}>
            Уже есть аккаунт?{' '}
            <Link to="/login" style={{ color: '#16a34a', fontWeight: 700 }}>Войти</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
