import useAuthStore from '../../store/authStore';
import Layout from '../../components/layout/Layout';
import XPBar from '../../components/gamification/XPBar';

export default function ProfilePage() {
  const { user, logout } = useAuthStore();
  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-4">
          <h1 className="text-2xl font-bold text-white mb-1">{user?.full_name}</h1>
          <p className="text-slate-400 text-sm mb-4">{user?.email}</p>
          <XPBar xp={user?.xp || 0} level={user?.level || 1} xpToNext={user?.xp_to_next_level || 100} />
        </div>
        <button onClick={logout} className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold py-3 rounded-xl transition">
          Выйти из аккаунта
        </button>
      </div>
    </Layout>
  );
}
