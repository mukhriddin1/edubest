import { motion } from 'framer-motion';
import { clsx } from 'clsx';

const LEVEL_COLORS = {
  1: 'from-slate-400 to-slate-300',
  2: 'from-emerald-500 to-emerald-300',
  3: 'from-sky-500 to-sky-300',
  4: 'from-violet-500 to-violet-300',
  5: 'from-amber-500 to-amber-300',
  6: 'from-orange-500 to-rose-400',
  7: 'from-rose-500 to-pink-400',
  8: 'from-fuchsia-500 to-purple-400',
  9: 'from-amber-400 to-yellow-300',
  10: 'from-amber-300 via-yellow-200 to-amber-300',
};

export default function XPBar({ xp, level, xpToNext }) {
  const colorClass = LEVEL_COLORS[level] || LEVEL_COLORS[5];
  const progress = xpToNext > 0 ? Math.min(100, ((xp % xpToNext) / xpToNext) * 100) : 100;

  return (
    <div className="flex items-center gap-4">
      {/* Level badge */}
      <div className={clsx(
        'w-12 h-12 shrink-0 rounded-xl bg-gradient-to-br flex items-center justify-center font-black text-slate-950 text-lg shadow-lg',
        colorClass
      )}>
        {level}
      </div>

      {/* Bar */}
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-slate-400 font-medium">Уровень {level}</span>
          <span className="text-xs text-slate-500">{xp} XP</span>
        </div>
        <div className="h-2.5 bg-slate-700 rounded-full overflow-hidden">
          <motion.div
            className={clsx('h-full rounded-full bg-gradient-to-r', colorClass)}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
          />
        </div>
        {xpToNext > 0 && (
          <p className="text-xs text-slate-600 mt-1">{xpToNext} XP до следующего уровня</p>
        )}
      </div>
    </div>
  );
}
