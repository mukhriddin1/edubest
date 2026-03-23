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

  const validate = () => {
    const errs = {};
    if (!form.first_name.trim()) errs.first_name = 'Введи имя';
    if (!form.last_name.trim()) errs.last_name = 'Введи фамилию';
    if (!form.email.includes('@')) errs.email = 'Некорректный email';
    if (form.password.length < 8) errs.password = 'Минимум 8 символов';
    if (!/[A-Za-z]/.test(form.password)) errs.password = 'Пароль должен содержать буквы';
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

  const update = (field, val) => {
    setForm(f => ({ ...f, [field]: val }));
    if (errors[field]) setErrors(e => ({ ...e, [field]: '' }));
  };

  const InputField = ({ label, field, type = 'text', placeholder }) => (
    <div>
      <label className="text-gray-700 text-sm font-semibold mb-1.5 block">{label}</label>
      <input
        type={type} value={form[field]} onChange={e => update(field, e.target.value)}
        className={`w-full bg-gray-50 border-2 ${errors[field] ? 'border-red-300 bg-red-50' : 'border-gray-200 focus:border-green-400'} rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:bg-white transition text-sm`}
        placeholder={placeholder}
      />
      {errors[field] && (
        <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
          <span>⚠️</span> {errors[field]}
        </p>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Link to="/" className="text-3xl font-black text-green-600">EDU BEST</Link>
          <p className="text-gray-500 text-sm mt-1">Платформа подготовки к ОРТ 🇰🇬</p>
        </div>

        <div className="bg-white border border-green-100 rounded-3xl p-8 shadow-xl shadow-green-100">
          <h1 className="text-2xl font-black text-gray-900 mb-1">Создай аккаунт</h1>
          <p className="text-gray-500 text-sm mb-6">Регистрация бесплатная — займёт 1 минуту</p>

          {errors.general && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-5 text-sm"
            >
              <span>⚠️</span> {errors.general}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <InputField label="Имя" field="first_name" placeholder="Мухриддин" />
              <InputField label="Фамилия" field="last_name" placeholder="Иванов" />
            </div>
            <InputField label="Email" field="email" type="email" placeholder="your@email.com" />
            <InputField label="Пароль" field="password" type="password" placeholder="Минимум 8 символов" />
            <InputField label="Повтори пароль" field="confirm_password" type="password" placeholder="••••••••" />

            {/* Password strength */}
            {form.password && (
              <div className="space-y-1">
                <p className="text-xs text-gray-500">Требования к паролю:</p>
                {[
                  { check: form.password.length >= 8, text: 'Минимум 8 символов' },
                  { check: /[A-Za-z]/.test(form.password), text: 'Содержит буквы' },
                  { check: /[0-9]/.test(form.password), text: 'Содержит цифры' },
                ].map(r => (
                  <div key={r.text} className="flex items-center gap-2 text-xs">
                    <span className={r.check ? 'text-green-500' : 'text-gray-300'}>
                      {r.check ? '✓' : '○'}
                    </span>
                    <span className={r.check ? 'text-green-600' : 'text-gray-400'}>{r.text}</span>
                  </div>
                ))}
              </div>
            )}

            <button
              type="submit" disabled={loading}
              className="w-full bg-green-500 hover:bg-green-400 text-white font-bold py-3.5 rounded-xl transition disabled:opacity-50 shadow-lg shadow-green-200 text-sm mt-2"
            >
              {loading ? '⏳ Создаём аккаунт...' : 'Создать аккаунт →'}
            </button>
          </form>

          <p className="mt-5 text-center text-gray-500 text-sm">
            Уже есть аккаунт?{' '}
            <Link to="/login" className="text-green-600 font-semibold hover:underline">Войти</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
