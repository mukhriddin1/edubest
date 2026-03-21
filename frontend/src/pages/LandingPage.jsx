import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const fadeUp = (delay = 0) => ({
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, delay } },
});

const FEATURES = [
  { icon: '🎯', title: 'Адаптивные тесты', desc: 'Алгоритм подбирает вопросы по твоему уровню — точно как на реальном ОРТ' },
  { icon: '⏱️', title: 'Реальные условия', desc: 'Жёсткий таймер, блокировка разделов — тренируйся в условиях настоящего экзамена' },
  { icon: '📊', title: 'Глубокая аналитика', desc: 'Видишь свой прогресс, слабые темы и динамику баллов в понятных графиках' },
  { icon: '🏆', title: 'Геймификация', desc: 'Зарабатывай XP, открывай достижения и соревнуйся в еженедельном лидерборде' },
  { icon: '📱', title: 'Mobile First', desc: 'Работает на любом устройстве — готовься в транспорте, дома или в школе' },
  { icon: '🇰🇬', title: 'На двух языках', desc: 'Полный интерфейс и вопросы на русском и кыргызском языках' },
];

const STATS = [
  { value: '1000+', label: 'Вопросов в базе' },
  { value: '245', label: 'Максимальный балл' },
  { value: '4', label: 'Раздела ОРТ' },
  { value: '10', label: 'Уровней прокачки' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans">
      {/* Navbar */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <span className="text-xl font-black text-amber-400 tracking-tight">EDU BEST</span>
          <div className="hidden sm:flex items-center gap-6 text-sm text-slate-400">
            <Link to="/pricing" className="hover:text-white transition">Тарифы</Link>
            <Link to="/leaderboard" className="hover:text-white transition">Лидерборд</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm text-slate-300 hover:text-white transition px-4 py-2 rounded-lg hover:bg-slate-800">
              Войти
            </Link>
            <Link to="/register" className="text-sm bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-lg transition">
              Начать бесплатно
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-amber-500/8 rounded-full blur-3xl" />
        </div>

        <div className="max-w-4xl mx-auto text-center relative">
          <motion.div variants={fadeUp(0)} initial="hidden" animate="show">
            <span className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold px-4 py-1.5 rounded-full mb-6">
              🇰🇬 Платформа #1 для подготовки к ОРТ в Кыргызстане
            </span>
          </motion.div>

          <motion.h1
            variants={fadeUp(0.1)} initial="hidden" animate="show"
            className="text-5xl sm:text-7xl font-black leading-tight tracking-tight mb-6"
          >
            Сдай ОРТ на{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">
              высокий балл
            </span>
          </motion.h1>

          <motion.p
            variants={fadeUp(0.2)} initial="hidden" animate="show"
            className="text-slate-400 text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Адаптивные тесты, реальные условия экзамена, геймификация и подробная аналитика.
            Более 1000 вопросов по всем разделам ОРТ.
          </motion.p>

          <motion.div
            variants={fadeUp(0.3)} initial="hidden" animate="show"
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              to="/register"
              className="w-full sm:w-auto bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-8 py-4 rounded-2xl text-lg transition transform hover:scale-105 shadow-lg shadow-amber-500/25"
            >
              Начать бесплатно →
            </Link>
            <Link
              to="/tests?demo=1"
              className="w-full sm:w-auto border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white px-8 py-4 rounded-2xl text-lg transition"
            >
              Демо-тест (без регистрации)
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="py-10 border-y border-slate-800">
        <div className="max-w-4xl mx-auto px-4 grid grid-cols-2 sm:grid-cols-4 gap-6">
          {STATS.map((s, i) => (
            <motion.div
              key={s.label}
              variants={fadeUp(0.1 * i)} initial="hidden" whileInView="show" viewport={{ once: true }}
              className="text-center"
            >
              <div className="text-3xl font-black text-amber-400">{s.value}</div>
              <div className="text-slate-500 text-sm mt-1">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.h2
            variants={fadeUp()} initial="hidden" whileInView="show" viewport={{ once: true }}
            className="text-3xl sm:text-4xl font-black text-center mb-12"
          >
            Всё, что нужно для подготовки
          </motion.h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                variants={fadeUp(0.08 * i)} initial="hidden" whileInView="show" viewport={{ once: true }}
                className="bg-slate-900 border border-slate-800 hover:border-slate-600 rounded-2xl p-6 transition-colors"
              >
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="font-bold text-white mb-2">{f.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <motion.div
          variants={fadeUp()} initial="hidden" whileInView="show" viewport={{ once: true }}
          className="max-w-3xl mx-auto bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-slate-900 border border-amber-500/20 rounded-3xl p-10 text-center"
        >
          <h2 className="text-3xl sm:text-4xl font-black mb-4">Готов начать?</h2>
          <p className="text-slate-400 mb-8">Пройди демо-тест прямо сейчас — без регистрации</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="w-full sm:w-auto bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-8 py-4 rounded-2xl transition"
            >
              Зарегистрироваться бесплатно
            </Link>
            <Link
              to="/pricing"
              className="text-amber-400 hover:text-amber-300 text-sm underline underline-offset-4 transition"
            >
              Посмотреть тарифы
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8 px-4 text-center text-slate-600 text-sm">
        <p>© 2024 EDU BEST. Все права защищены. | Кыргызстан 🇰🇬</p>
      </footer>
    </div>
  );
}
