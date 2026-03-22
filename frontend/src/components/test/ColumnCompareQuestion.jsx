import { motion } from 'framer-motion';
import { clsx } from 'clsx';


/**
 * Сравнение колонок — специальный тип вопроса ОРТ.
 * Показывает две колонки А и Б, студент выбирает соответствие.
 * Варианты ответа всегда 4: A>B, A<B, A=B, Нельзя определить
 */
export default function ColumnCompareQuestion({ question, selectedAnswer, onSelect, disabled }) {
  
  

  const getText = (ru, ky) => (lang === 'ky' && ky ? ky : ru);

  const colA = getText(question.column_a_ru, question.column_a_ky);
  const colB = getText(question.column_b_ru, question.column_b_ky);
  const topText = getText(question.text_ru, question.text_ky);
  const answers = question.answers || [];

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
        <span className="text-amber-400 text-xs font-bold uppercase tracking-wider">
          Сравнение величин
        </span>
        <span className="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded-md">
          Тип: Колонки
        </span>
      </div>

      {/* Task description */}
      {topText && (
        <div className="px-6 py-4 border-b border-slate-800">
          <p className="text-slate-300 text-sm leading-relaxed">{topText}</p>
        </div>
      )}

      {/* Two columns */}
      <div className="px-6 py-5 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 overflow-hidden">
          <div className="bg-slate-700/50 px-4 py-2 text-center">
            <span className="text-amber-400 font-bold text-sm">Колонка А</span>
          </div>
          <div className="px-4 py-4 text-center">
            <p className="text-white text-lg font-semibold leading-relaxed">{colA}</p>
          </div>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 overflow-hidden">
          <div className="bg-slate-700/50 px-4 py-2 text-center">
            <span className="text-sky-400 font-bold text-sm">Колонка Б</span>
          </div>
          <div className="px-4 py-4 text-center">
            <p className="text-white text-lg font-semibold leading-relaxed">{colB}</p>
          </div>
        </div>
      </div>

      {/* Answer choices */}
      <div className="px-6 pb-6 flex flex-col gap-2">
        <p className="text-xs text-slate-500 mb-1">Выберите правильный вариант:</p>
        {answers.map((answer) => {
          const answerText = getText(answer.text_ru, answer.text_ky);
          const isSelected = selectedAnswer === answer.id;

          return (
            <motion.button
              key={answer.id}
              onClick={() => !disabled && onSelect(answer.id)}
              whileTap={!disabled ? { scale: 0.98 } : {}}
              className={clsx(
                'w-full text-left px-4 py-3 rounded-xl border-2 transition-all text-sm flex items-center gap-3',
                disabled && 'cursor-not-allowed opacity-60',
                isSelected
                  ? 'border-amber-400 bg-amber-400/10 text-white'
                  : 'border-slate-700 bg-slate-800/50 text-slate-300 hover:border-slate-500 hover:text-white'
              )}
            >
              <span className={clsx(
                'w-6 h-6 shrink-0 rounded-full border-2 flex items-center justify-center transition-colors',
                isSelected ? 'border-amber-400 bg-amber-400' : 'border-slate-600'
              )}>
                {isSelected && (
                  <svg viewBox="0 0 10 10" className="w-3 h-3 text-slate-950" fill="currentColor">
                    <path d="M1.5 5L4 7.5L8.5 2.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                  </svg>
                )}
              </span>
              {answerText}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
