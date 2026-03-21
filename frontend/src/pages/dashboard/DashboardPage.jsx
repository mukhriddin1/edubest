import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import api from '../../api/axios';
import useAuthStore from '../../store/authStore';
import XPBar from '../../components/gamification/XPBar';
import DailyQuestCard from '../../components/gamification/DailyQuestCard';
import Layout from '../../components/layout/Layout';

const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

export default function DashboardPage() {
  const { user } = useAuthStore();

  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.get('/tests/history/').then(r => r.data),
  });

  const { data: dailyQuests } = useQuery({
    queryKey: ['daily-quests'],
    queryFn: () => api.get('/gamification/daily-quests/').then(r => r.data),
  });

  const recentTests = stats?.results?.slice(0, 10) || [];

  // Build chart data from history
  const chartData = recentTests.slice().reverse().map((t, i) => ({
    name: `Тест ${i + 1}`,
    score: t.scaled_score,
  }));

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Welcome + XP */}
        <motion.div
          variants={fadeUp} initial="hidden" animate="show"
          className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-2xl p-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white">
                Привет, {user?.first_name}! 👋
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                Продолжай готовиться — ОРТ ближе, чем кажется
              </p>
            </div>
            <Link
              to="/tests"
              className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-6 py-3 rounded-xl transition text-sm"
            >
              ▶ Начать тест
            </Link>
          </div>

          <div className="mt-5">
            <XPBar
              xp={user?.xp || 0}
              level={user?.level || 1}
              xpToNext={user?.xp_to_next_level || 100}
            />
          </div>
        </motion.div>

        {/* Stats cards */}
        <motion.div
          variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.1 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-4"
        >
          {[
            { label: 'Тестов пройдено', value: stats?.count || 0, icon: '📝', color: 'amber' },
            { label: 'Средний балл', value: stats?.avg_score || '—', icon: '📊', color: 'sky' },
            { label: 'Лучший балл', value: stats?.best_score || '—', icon: '🏆', color: 'emerald' },
            { label: 'Уровень', value: user?.level || 1, icon: '⚡', color: 'purple' },
          ].map((card) => (
            <div key={card.label} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <p className="text-2xl mb-1">{card.icon}</p>
              <p className="text-2xl font-bold text-white">{card.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{card.label}</p>
            </div>
          ))}
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Score chart */}
          <motion.div
            variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.2 }}
            className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5"
          >
            <h2 className="text-white font-semibold mb-4">Динамика баллов</h2>
            {chartData.length > 1 ? (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} />
                  <YAxis domain={[100, 245]} tick={{ fill: '#64748b', fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                    labelStyle={{ color: '#94a3b8' }}
                    itemStyle={{ color: '#f59e0b' }}
                  />
                  <Area
                    type="monotone" dataKey="score" stroke="#f59e0b"
                    strokeWidth={2} fill="url(#scoreGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center">
                <p className="text-slate-500 text-sm">Пройди хотя бы 2 теста, чтобы увидеть график</p>
              </div>
            )}
          </motion.div>

          {/* Daily quests */}
          <motion.div
            variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.3 }}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-5"
          >
            <h2 className="text-white font-semibold mb-4">📅 Задания на сегодня</h2>
            <div className="space-y-3">
              {dailyQuests?.results?.map((quest) => (
                <DailyQuestCard key={quest.id} quest={quest} />
              )) || (
                <p className="text-slate-500 text-sm">Загружаем задания...</p>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}
