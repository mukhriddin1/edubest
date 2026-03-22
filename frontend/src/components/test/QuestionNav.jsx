export default function QuestionNav({ questions, currentIndex, answers, onSelect }) {
  return (
    <div className="flex flex-wrap gap-2">
      {questions.map((q, i) => (
        <button key={q.id} onClick={() => onSelect(i)}
          className={`w-8 h-8 rounded-lg text-xs font-bold transition ${
            i === currentIndex ? 'bg-amber-400 text-slate-950' :
            answers[q.id] !== undefined ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
            'bg-slate-800 text-slate-400 hover:bg-slate-700'
          }`}>
          {i + 1}
        </button>
      ))}
    </div>
  );
}
