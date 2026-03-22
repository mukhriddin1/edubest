import { motion } from 'framer-motion';

export default function SectionTransition({ section, answeredCount, totalCount, isTimeUp, isLastSection, onContinue }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="fixed inset-0 bg-slate-950/90 backdrop-blur z-50 flex items-center justify-center px-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 max-w-md w-full text-center">
        <p className="text-3xl mb-4">{isTimeUp ? '⏰' : '✅'}</p>
        <h2 className="text-xl font-bold text-white mb-2">
          {isTimeUp ? 'Время истекло!' : 'Раздел завершён'}
        </h2>
        <p className="text-slate-400 mb-2">{section?.subject_name_ru}</p>
        <p className="text-slate-300 mb-6">Отвечено: {answeredCount} из {totalCount}</p>
        <button onClick={onContinue}
          className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3 rounded-xl transition">
          {isLastSection ? 'Завершить тест' : 'Следующий раздел →'}
        </button>
      </div>
    </motion.div>
  );
}
