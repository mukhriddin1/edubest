import { motion } from 'framer-motion';

export default function TestCompletedModal({ result, onClose }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="fixed inset-0 bg-slate-950 flex items-center justify-center px-4 z-50">
      <div className="text-center">
        <p className="text-5xl mb-4">🎉</p>
        <h1 className="text-3xl font-black text-white mb-2">Тест завершён!</h1>
        <p className="text-6xl font-black text-amber-400 my-4">{result?.scaled_score}</p>
        <p className="text-slate-400 mb-2">баллов ОРТ</p>
        <p className="text-emerald-400 mb-8">+{result?.xp_earned} XP</p>
        <button onClick={onClose}
          className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-8 py-3 rounded-xl transition">
          Посмотреть детали →
        </button>
      </div>
    </motion.div>
  );
}
