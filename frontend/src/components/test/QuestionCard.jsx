import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { useTranslation } from 'react-i18next';

export default function QuestionCard({ question, questionNumber, totalQuestions, selectedAnswer, onSelect, disabled }) {
  const { i18n } = useTranslation();
  const lang = i18n.language === 'ky' ? 'ky' : 'ru';

  const text = lang === 'ky' && question.text_ky ? question.text_ky : question.text_ru;
  const answers = question.answers || [];

  const LETTERS = ['А', 'Б', 'В', 'Г', 'Д'];

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
      {/* Question header */}
      <div className="px-6 py-4 border-b border-slate-800 flex items-center gap-3">
        <span className="text-xs text-slate-500 font-medium">
          Вопрос {questionNumber} из {totalQuestions}
        </span>
        <span className={clsx(
          'text-xs px-2 py-0.5 rounded-full font-medium',
          question.difficulty <= 2 ? 'bg-emerald-500/15 text-emerald-400' :
          question.difficulty === 3 ? 'bg-amber-500/15 text-amber-400' :
          'bg-red-500/15 text-red-400'
        )}>
          {question.difficulty <= 2 ? 'Лёгкий' : question.difficulty === 3 ? 'Средний' : 'Сложный'}
        </span>
      </div>

      {/* Question text */}
      <div className="px-6 py-5">
        {question.image && (
          <img
            src={question.image}
            alt="Иллюстрация к вопросу"
            className="w-full max-h-64 object-contain rounded-lg mb-4 bg-slate-800"
          />
        )}
        <p className="text-white text-lg leading-relaxed font-medium" style={{ fontSize: '1.05rem' }}>
          {text}
        </p>
      </div>

      {/* Answer options */}
      <div className="px-6 pb-6 flex flex-col gap-2.5">
        {answers.map((answer, idx) => {
          const answerText = lang === 'ky' && answer.text_ky ? answer.text_ky : answer.text_ru;
          const isSelected = selectedAnswer === answer.id;

          return (
            <motion.button
              key={answer.id}
              onClick={() => !disabled && onSelect(answer.id)}
              whileTap={!disabled ? { scale: 0.98 } : {}}
              className={clsx(
                'w-full text-left px-4 py-3.5 rounded-xl border-2 transition-all duration-150 flex items-center gap-3 group',
                disabled && 'cursor-not-allowed opacity-60',
                isSelected
                  ? 'border-amber-400 bg-amber-400/10 text-white'
                  : 'border-slate-700 bg-slate-800/50 text-slate-300 hover:border-slate-500 hover:text-white hover:bg-slate-800'
              )}
            >
              <span className={clsx(
                'w-8 h-8 shrink-0 rounded-lg flex items-center justify-center text-sm font-bold transition-colors',
                isSelected ? 'bg-amber-400 text-slate-950' : 'bg-slate-700 text-slate-400 group-hover:bg-slate-600'
              )}>
                {LETTERS[idx]}
              </span>
              <span className="text-sm leading-relaxed">{answerText}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
