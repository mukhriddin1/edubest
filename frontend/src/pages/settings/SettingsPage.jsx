import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import useAuthStore from '../../store/authStore';
import Layout from '../../components/layout/Layout';

const FONT_SIZES = [
  { label: 'Маленький', value: '14px' },
  { label: 'Стандартный', value: '16px' },
  { label: 'Большой (для слабовидящих)', value: '20px' },
  { label: 'Очень большой', value: '24px' },
];

export default function SettingsPage() {
  const { user } = useAuthStore();
  const [language, setLanguage] = useState(user?.language || 'ru');
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [fontSize, setFontSize] = useState(localStorage.getItem('fontSize') || '16px');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    localStorage.setItem('theme', theme);
    localStorage.setItem('fontSize', fontSize);
    localStorage.setItem('language', language);
    document.documentElement.style.fontSize = fontSize;
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const Section = ({ title, children }) => (
    <div className="bg-white border border-green-100 rounded-2xl p-6 mb-4">
      <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">{title}</h2>
      {children}
    </div>
  );

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-black text-gray-900 mb-6">⚙️ Настройки</h1>

          {/* Language */}
          <Section title="🌐 Язык интерфейса">
            <div className="grid grid-cols-2 gap-3">
              {[
                { code: 'ru', label: 'Русский', flag: '🇷🇺' },
                { code: 'ky', label: 'Кыргызча', flag: '🇰🇬' },
              ].map(lang => (
                <button
                  key={lang.code}
                  onClick={() => setLanguage(lang.code)}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 transition font-semibold text-sm ${
                    language === lang.code
                      ? 'border-green-400 bg-green-50 text-green-700'
                      : 'border-gray-200 hover:border-green-200 text-gray-700'
                  }`}
                >
                  <span className="text-2xl">{lang.flag}</span>
                  {lang.label}
                  {language === lang.code && <span className="ml-auto text-green-500">✓</span>}
                </button>
              ))}
            </div>
          </Section>

          {/* Theme */}
          <Section title="🎨 Тема оформления">
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'light', label: 'Светлая', icon: '☀️', desc: 'Зелёно-белая тема' },
                { value: 'dark', label: 'Тёмная', icon: '🌙', desc: 'Тёмная тема' },
              ].map(t => (
                <button
                  key={t.value}
                  onClick={() => setTheme(t.value)}
                  className={`p-4 rounded-xl border-2 transition text-left ${
                    theme === t.value
                      ? 'border-green-400 bg-green-50'
                      : 'border-gray-200 hover:border-green-200'
                  }`}
                >
                  <div className="text-2xl mb-1">{t.icon}</div>
                  <div className="font-semibold text-gray-900 text-sm">{t.label}</div>
                  <div className="text-gray-500 text-xs">{t.desc}</div>
                  {theme === t.value && <div className="text-green-500 text-xs mt-1 font-bold">✓ Активна</div>}
                </button>
              ))}
            </div>
          </Section>

          {/* Accessibility */}
          <Section title="👁️ Размер шрифта (для слабовидящих)">
            <div className="space-y-2">
              {FONT_SIZES.map(f => (
                <button
                  key={f.value}
                  onClick={() => setFontSize(f.value)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition ${
                    fontSize === f.value
                      ? 'border-green-400 bg-green-50 text-green-700'
                      : 'border-gray-200 hover:border-green-200 text-gray-700'
                  }`}
                >
                  <span style={{ fontSize: f.value, fontWeight: 500 }}>{f.label}</span>
                  {fontSize === f.value && <span className="text-green-500 text-sm">✓</span>}
                </button>
              ))}
            </div>
          </Section>

          {/* Support */}
          <Section title="💬 Поддержка">
            <div className="space-y-3">
              <a
                href="https://github.com/mukhriddin1"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 hover:border-green-300 hover:bg-green-50 transition"
              >
                <span className="text-2xl">🐙</span>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">GitHub</p>
                  <p className="text-gray-500 text-xs">Сообщить об ошибке или предложить улучшение</p>
                </div>
              </a>
              <div className="flex items-center gap-3 p-4 rounded-xl border border-gray-200">
                <span className="text-2xl">📧</span>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Email поддержки</p>
                  <p className="text-gray-500 text-xs">mukhriddin010307@gmail.com</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-xl border border-gray-200">
                <span className="text-2xl">ℹ️</span>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Версия приложения</p>
                  <p className="text-gray-500 text-xs">EDU BEST v1.0.0 · 2026</p>
                </div>
              </div>
            </div>
          </Section>

          {/* Save button */}
          <button
            onClick={handleSave}
            className="w-full bg-green-500 hover:bg-green-400 text-white font-bold py-4 rounded-xl transition shadow-lg shadow-green-200"
          >
            {saved ? '✓ Настройки сохранены!' : 'Сохранить настройки'}
          </button>
        </motion.div>
      </div>
    </Layout>
  );
}
