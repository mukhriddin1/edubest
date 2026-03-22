import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/axios';
import Layout from '../../components/layout/Layout';

export default function TestResultPage() {
  const { sessionId } = useParams();
  const { data, isLoading } = useQuery({
    queryKey: ['result', sessionId],
    queryFn: () => api.get(`/tests/result/${sessionId}/`).then(r => r.data),
  });

  if (isLoading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><p className="text-white">Загрузка...</p></div>;

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center mb-6">
          <p className="text-slate-400 mb-2">Твой результат</p>
          <p className="text-6xl font-black text-amber-400">{data?.scaled_score}</p>
          <p className="text-slate-500 mt-2">баллов ОРТ</p>
          <p className="text-emerald-400 mt-2">+{data?.xp_earned} XP заработано</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          {data?.section_results?.map(s => (
            <div key={s.subject_name_ru} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <p className="text-white font-semibold">{s.subject_name_ru}</p>
              <p className="text-amber-400 text-xl font-bold">{s.correct_answers}/{s.total_questions}</p>
            </div>
          ))}
        </div>
        <div className="flex gap-3">
          <Link to="/tests" className="flex-1 text-center bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3 rounded-xl transition">Ещё раз</Link>
          <Link to="/dashboard" className="flex-1 text-center bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl transition">На главную</Link>
        </div>
      </div>
    </Layout>
  );
}
