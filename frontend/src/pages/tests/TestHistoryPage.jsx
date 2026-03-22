import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import Layout from '../../components/layout/Layout';

export default function TestHistoryPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['history'],
    queryFn: () => api.get('/tests/history/').then(r => r.data),
  });

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-white mb-6">История тестов</h1>
        {isLoading ? <p className="text-slate-400">Загрузка...</p> : (
          <div className="space-y-3">
            {data?.results?.map(t => (
              <Link key={t.id} to={`/tests/result/${t.id}`}
                className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-slate-600 transition">
                <div>
                  <p className="text-white font-medium">{t.template_name}</p>
                  <p className="text-slate-500 text-sm">{new Date(t.completed_at).toLocaleDateString('ru')}</p>
                </div>
                <p className="text-amber-400 font-bold text-xl">{t.scaled_score}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
