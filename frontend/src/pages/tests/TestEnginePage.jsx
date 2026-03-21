import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import useTestStore from '../../store/testStore';
import api from '../../api/axios';
import SectionTimer from '../../components/test/SectionTimer';
import QuestionCard from '../../components/test/QuestionCard';
import ColumnCompareQuestion from '../../components/test/ColumnCompareQuestion';
import QuestionNav from '../../components/test/QuestionNav';
import SectionTransition from '../../components/test/SectionTransition';
import TestCompletedModal from '../../components/test/TestCompletedModal';

export default function TestEnginePage() {
  const { templateId, sessionId } = useParams();
  const navigate = useNavigate();
  const [showSectionTransition, setShowSectionTransition] = useState(false);
  const [isTimeUp, setIsTimeUp] = useState(false);
  const timeUpHandled = useRef(false);

  const {
    session, currentSectionIndex, currentQuestionIndex,
    answers, isCompleted, result,
    loadSession, selectAnswer, nextQuestion, prevQuestion,
    goToQuestion, advanceSection, getCurrentSection,
    getCurrentQuestion, getCurrentSectionQuestions, getAnsweredCount,
    getSectionTimeLimit,
  } = useTestStore();

  // Start or resume session
  useEffect(() => {
    const initSession = async () => {
      if (session) return; // Already loaded from sessionStorage

      try {
        let response;
        if (sessionId) {
          response = await api.get(`/tests/session/${sessionId}/`);
          loadSession(response.data.session, response.data.cached_answers || {});
        } else if (templateId) {
          response = await api.post(`/tests/${templateId}/start/`);
          loadSession(response.data.session, {});
          if (response.data.resumed) toast('Сессия восстановлена', { icon: '🔄' });
        }
      } catch (err) {
        toast.error('Не удалось загрузить тест');
        navigate('/tests');
      }
    };
    initSession();
  }, []);

  // Handle section timer expiry
  const handleTimeUp = useCallback(async () => {
    if (timeUpHandled.current) return;
    timeUpHandled.current = true;
    setIsTimeUp(true);
    toast('⏰ Время раздела истекло!', { duration: 3000 });
    await new Promise(r => setTimeout(r, 2000));
    setShowSectionTransition(true);
  }, []);

  const handleSectionContinue = async () => {
    setShowSectionTransition(false);
    setIsTimeUp(false);
    timeUpHandled.current = false;
    await advanceSection();
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isCompleted && result) {
    return <TestCompletedModal result={result} onClose={() => navigate(`/tests/result/${session.id}`)} />;
  }

  const currentSection = getCurrentSection();
  const currentQuestion = getCurrentQuestion();
  const sectionQuestions = getCurrentSectionQuestions();
  const answeredCount = getAnsweredCount();
  const timeLimit = getSectionTimeLimit();

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-800">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          {/* Section info */}
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-amber-400 font-bold text-sm shrink-0">
              Раздел {currentSectionIndex + 1}
            </span>
            <span className="text-slate-300 text-sm truncate">
              {currentSection?.subject_name_ru}
            </span>
          </div>

          {/* Progress */}
          <div className="hidden sm:flex items-center gap-2 text-sm text-slate-400">
            <span className="text-white font-semibold">{answeredCount}</span>
            <span>/</span>
            <span>{sectionQuestions.length}</span>
            <span>ответов</span>
          </div>

          {/* Timer */}
          {timeLimit > 0 && (
            <SectionTimer
              totalSeconds={timeLimit}
              sectionStartTime={useTestStore.getState().sectionStartTime}
              onTimeUp={handleTimeUp}
            />
          )}
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-slate-800">
          <motion.div
            className="h-full bg-gradient-to-r from-amber-500 to-amber-300"
            animate={{ width: `${(answeredCount / Math.max(sectionQuestions.length, 1)) * 100}%` }}
            transition={{ ease: 'easeOut', duration: 0.3 }}
          />
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6 flex flex-col gap-6">
        <AnimatePresence mode="wait">
          {currentQuestion && (
            <motion.div
              key={currentQuestion.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.2 }}
            >
              {currentQuestion.question_type === 'column_compare' ? (
                <ColumnCompareQuestion
                  question={currentQuestion}
                  selectedAnswer={answers[currentQuestion.id]}
                  onSelect={(answerId) => selectAnswer(currentQuestion.id, answerId)}
                  disabled={isTimeUp}
                />
              ) : (
                <QuestionCard
                  question={currentQuestion}
                  questionNumber={currentQuestionIndex + 1}
                  totalQuestions={sectionQuestions.length}
                  selectedAnswer={answers[currentQuestion.id]}
                  onSelect={(answerId) => selectAnswer(currentQuestion.id, answerId)}
                  disabled={isTimeUp}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={prevQuestion}
            disabled={currentQuestionIndex === 0}
            className="px-5 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition font-medium text-sm"
          >
            ← Назад
          </button>

          <span className="text-slate-500 text-sm">
            {currentQuestionIndex + 1} / {sectionQuestions.length}
          </span>

          {currentQuestionIndex < sectionQuestions.length - 1 ? (
            <button
              onClick={nextQuestion}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-sm transition"
            >
              Далее →
            </button>
          ) : (
            <button
              onClick={() => setShowSectionTransition(true)}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-semibold text-sm transition"
            >
              Завершить раздел ✓
            </button>
          )}
        </div>

        {/* Question dots navigator */}
        <QuestionNav
          questions={sectionQuestions}
          currentIndex={currentQuestionIndex}
          answers={answers}
          onSelect={goToQuestion}
        />
      </main>

      {/* Section transition modal */}
      <AnimatePresence>
        {showSectionTransition && (
          <SectionTransition
            section={currentSection}
            answeredCount={answeredCount}
            totalCount={sectionQuestions.length}
            isTimeUp={isTimeUp}
            isLastSection={currentSectionIndex >= (session?.sections?.length - 1)}
            onContinue={handleSectionContinue}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
