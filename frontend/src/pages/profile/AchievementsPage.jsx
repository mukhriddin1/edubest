import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios';
import Layout from '../../components/layout/Layout';

export default function AchievementsPage() {
  const { data } = useQuery({ queryKey: ['achievements'], queryFn: () => api.get('/gamification/achievements/').then(r => r.data) });
  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-white mb-6">🏆 Достижения</h1>
        <div className="grid sm:grid-cols-2 gap-4">
          {data?.results?.map(a => (
            <div key={a.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
              <span className="text-3xl">{a.icon}</span>
              <div><p className="text-white font-semibold">{a.name_ru}</p><p className="text-slate-400 text-xs">{a.description_ru}</p></div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
