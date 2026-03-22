import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios';
import Layout from '../../components/layout/Layout';

export default function LeaderboardPage() {
  const { data } = useQuery({ queryKey: ['leaderboard'], queryFn: () => api.get('/gamification/leaderboard/').then(r => r.data) });
  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-white mb-6">🏆 Лидерборд недели</h1>
        <div className="space-y-2">
          {data?.results?.map((e, i) => (
            <div key={e.id} className="flex items-center gap-4 bg-slate-900 border border-slate-800 rounded-xl p-4">
              <span className={`text-xl font-black w-8 ${i === 0 ? 'text-amber-400' : i === 1 ? 'text-slate-300' : i === 2 ? 'text-amber-600' : 'text-slate-500'}`}>#{e.rank}</span>
              <p className="text-white flex-1 font-medium">{e.user_name}</p>
              <p className="text-amber-400 font-bold">{e.xp_this_week} XP</p>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
