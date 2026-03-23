import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const fadeUp = (delay = 0) => ({
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, delay } },
});

const FEATURES = [
  { icon: '🎯', title: 'Адаптивные тесты', desc: 'Алгоритм подбирает вопросы под твой уровень — точно как на реальном ОРТ' },
  { icon: '⏱️', title: 'Реальные условия', desc: 'Жёсткий таймер и блокировка разделов — тренируйся как на настоящем экзамене' },
  { icon: '📊', title: 'Глубокая аналитика', desc: 'Видишь прогресс, слабые темы и динамику баллов в понятных графиках' },
  { icon: '🏆', title: 'Геймификация', desc: 'Зарабатывай XP, открывай достижения и соревнуйся в лидерборде' },
  { icon: '📱', title: 'Mobile First', desc: 'Работает идеально на телефоне — готовься где угодно' },
  { icon: '🇰🇬', title: 'На двух языках', desc: 'Полный интерфейс на русском и кыргызском языках' },
];

const SUBJECTS = [
  { name: 'Математика', icon: '📐', color: 'from-green-500 to-emerald-400', questions: 40, time: 70 },
  { name: 'Аналогии', icon: '🔗', color: 'from-teal-500 to-cyan-400', questions: 30, time: 40 },
  { name: 'Чтение', icon: '📖', color: 'from-emerald-500 to-green-400', questions: 30, time: 50 },
  { name: 'Грамматика', icon: '✍️', color: 'from-cyan-500 to-teal-400', questions: 20, time: 30 },
];

const STATS = [
  { value: '1000+', label: 'Вопросов в базе' },
  { value: '245', label: 'Максимальный балл' },
  { value: '4', label: 'Раздела ОРТ' },
  { value: '100%', label: 'Бесплатно для старта' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      {/* Navbar */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-white/95 backdrop-blur border-b border-green-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <span className="text-xl font-black text-green-600 tracking-tight">EDU BEST 🇰🇬</span>
          <div className="hidden sm:flex items-center gap-6 text-sm text-gray-600">
            <Link to="/pricing" className="hover:text-green-600 transition font-medium">Тарифы</Link>
            <Link to="/leaderboard" className="hover:text-green-600 transition font-medium">Лидерборд</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm text-gray-600 hover:text-green-600 transition px-4 py-2 rounded-xl hover:bg-green-50 font-medium">
              Войти
            </Link>
            <Link to="/register" className="text-sm bg-green-500 hover:bg-green-400 text-white font-bold px-4 py-2 rounded-xl transition shadow-md shadow-green-200">
              Начать бесплатно
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 relative overflow-hidden bg-gradient-to-b from-green-50 to-white">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 right-10 w-64 h-64 bg-green-200/30 rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-10 w-48 h-48 bg-emerald-200/20 rounded-full blur-2xl" />
        </div>

        <div className="max-w-4xl mx-auto text-center relative">
          <motion.div variants={fadeUp(0)} initial="hidden" animate="show">
            <span className="inline-flex items-center gap-2 bg-green-100 border border-green-200 text-green-700 text-xs font-bold px-4 py-1.5 rounded-full mb-6">
              🇰🇬 Платформа №1 для подготовки к ОРТ в Кыргызстане
            </span>
          </motion.div>

          <motion.h1
            variants={fadeUp(0.1)} initial="hidden" animate="show"
            className="text-4xl sm:text-6xl font-black leading-tight tracking-tight mb-6 text-gray-900"
          >
            Сдай ОРТ на{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-emerald-600">
              высокий балл
            </span>
            {' '}с первого раза
          </motion.h1>

          <motion.p
            variants={fadeUp(0.2)} initial="hidden" animate="show"
            className="text-gray-600 text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Более 1000 реальных вопросов ОРТ, адаптивный алгоритм обучения и подробная аналитика.
            Тысячи абитуриентов уже улучшили свои баллы с EDU BEST.
          </motion.p>

          <motion.div
            variants={fadeUp(0.3)} initial="hidden" animate="show"
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              to="/register"
              className="w-full sm:w-auto bg-green-500 hover:bg-green-400 text-white font-black px-8 py-4 rounded-2xl text-lg transition transform hover:scale-105 shadow-xl shadow-green-200"
            >
              Начать бесплатно →
            </Link>
            <Link
              to="/tests"
              className="w-full sm:w-auto border-2 border-green-300 hover:border-green-400 text-green-700 hover:bg-green-50 px-8 py-4 rounded-2xl text-lg font-bold transition"
            >
              Демо-тест (без регистрации)
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-green-500">
        <div className="max-w-4xl mx-auto px-4 grid grid-cols-2 sm:grid-cols-4 gap-6">
          {STATS.map((s, i) => (
            <motion.div
              key={s.label}
              variants={fadeUp(0.1 * i)} initial="hidden" whileInView="show" viewport={{ once: true }}
              className="text-center"
            >
              <div className="text-3xl font-black text-white">{s.value}</div>
              <div className="text-green-100 text-sm mt-1">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Subjects */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <motion.h2
            variants={fadeUp()} initial="hidden" whileInView="show" viewport={{ once: true }}
            className="text-3xl sm:text-4xl font-black text-center mb-4"
          >
            Все разделы ОРТ
          </motion.h2>
          <p className="text-gray-500 text-center mb-12">Готовься по каждому разделу отдельно или проходи полный тест</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {SUBJECTS.map((s, i) => (
              <motion.div
                key={s.name}
                variants={fadeUp(0.1 * i)} initial="hidden" whileInView="show" viewport={{ once: true }}
              >
                <Link to="/register" className="block bg-white border-2 border-green-100 hover:border-green-300 rounded-2xl p-6 transition hover:shadow-lg hover:shadow-green-100 group">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition`}>
                    {s.icon}
                  </div>
                  <h3 className="font-bold text-gray-900 text-lg mb-1">{s.name}</h3>
                  <p className="text-gray-500 text-sm">{s.questions} вопросов · {s.time} мин</p>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-green-50">
        <div className="max-w-5xl mx-auto">
          <motion.h2
            variants={fadeUp()} initial="hidden" whileInView="show" viewport={{ once: true }}
            className="text-3xl sm:text-4xl font-black text-center mb-12"
          >
            Всё что нужно для подготовки
          </motion.h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                variants={fadeUp(0.08 * i)} initial="hidden" whileInView="show" viewport={{ once: true }}
                className="bg-white border border-green-100 hover:border-green-300 rounded-2xl p-6 transition hover:shadow-md"
              >
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-white">
        <motion.div
          variants={fadeUp()} initial="hidden" whileInView="show" viewport={{ once: true }}
          className="max-w-3xl mx-auto bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl p-10 text-center shadow-2xl shadow-green-200"
        >
          <h2 className="text-3xl sm:text-4xl font-black mb-4 text-white">Начни готовиться сегодня!</h2>
          <p className="text-green-100 mb-8">Регистрация бесплатная. Первые тесты — сразу. Результат — через месяц.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="w-full sm:w-auto bg-white text-green-600 font-black px-8 py-4 rounded-2xl transition hover:bg-green-50 shadow-lg"
            >
              Зарегистрироваться бесплатно
            </Link>
            <Link to="/pricing" className="text-green-100 hover:text-white text-sm underline underline-offset-4 transition">
              Посмотреть тарифы
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-green-100 py-8 px-4 bg-white">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-gray-500 text-sm">
          <p>© 2026 EDU BEST. Все права защищены. 🇰🇬 Кыргызстан</p>
          <div className="flex items-center gap-4">
            <a href="https://github.com/mukhriddin1" target="_blank" rel="noreferrer" className="hover:text-green-600 transition font-medium">
              GitHub
            </a>
            <Link to="/pricing" className="hover:text-green-600 transition">Тарифы</Link>
            <Link to="/leaderboard" className="hover:text-green-600 transition">Лидерборд</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
