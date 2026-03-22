import { Link } from 'react-router-dom';
import Layout from '../../components/layout/Layout';

export default function TeacherDashboard() {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-white mb-6">Кабинет учителя</h1>
        <Link to="/teacher/tests/new" className="inline-block bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-6 py-3 rounded-xl transition">
          + Создать тест
        </Link>
      </div>
    </Layout>
  );
}
