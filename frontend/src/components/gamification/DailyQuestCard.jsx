export default function DailyQuestCard({ quest }) {
  const progress = quest.progress || 0;
  const target = quest.target_value || 5;
  const percent = Math.min(100, (progress / target) * 100);

  return (
    <div className="bg-slate-800 rounded-xl p-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-white text-sm font-medium">{quest.title_ru}</p>
        <span className="text-amber-400 text-xs font-bold">+{quest.xp_reward} XP</span>
      </div>
      <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${percent}%` }} />
      </div>
      <p className="text-slate-500 text-xs mt-1">{progress}/{target}</p>
    </div>
  );
}
