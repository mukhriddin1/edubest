import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import Layout from '../../components/layout/Layout';

export default function TestSelectPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['templates'],
    queryFn: () => api.get('/tests/templates/').then(r => r.data),
  });

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-white mb-6">Выбери тест</h1>
        {isLoading ? (
          <p className="text-slate-400">Загрузка...</p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {data?.map(t => (
              <div key={t.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <h2 className="text-white font-bold text-lg mb-2">{t.name_ru}</h2>
                <p className="text-slate-400 text-sm mb-4">{t.sections?.length} разделов</p>
                <Link to={`/tests/${t.id}/start`}
                  className="inline-block bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-6 py-2 rounded-xl transition text-sm">
                  Начать →
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
