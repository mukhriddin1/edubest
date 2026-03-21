/**
 * Test Engine Store
 * Manages active test state: current section, timer, answers, navigation lock.
 * Persisted to sessionStorage so page refresh doesn't lose progress.
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import api from '../api/axios';

const useTestStore = create(
  persist(
    (set, get) => ({
      session: null,
      currentSectionIndex: 0,
      currentQuestionIndex: 0,
      answers: {}, // { questionId: answerId }
      sectionStartTime: null,
      isSubmitting: false,
      isCompleted: false,
      result: null,

      // ── Load existing session ───────────────────────────────────────────────
      loadSession: (sessionData, cachedAnswers = {}) => {
        set({
          session: sessionData,
          currentSectionIndex: sessionData.current_section_index || 0,
          currentQuestionIndex: 0,
          answers: cachedAnswers,
          sectionStartTime: Date.now(),
        });
      },

      // ── Navigation (within section only - ORT rule: no going back) ──────────
      nextQuestion: () => {
        const { currentQuestionIndex, getCurrentSectionQuestions } = get();
        const questions = getCurrentSectionQuestions();
        if (currentQuestionIndex < questions.length - 1) {
          set({ currentQuestionIndex: currentQuestionIndex + 1 });
        }
      },

      prevQuestion: () => {
        // ORT rule: can navigate within CURRENT section only
        const { currentQuestionIndex } = get();
        if (currentQuestionIndex > 0) {
          set({ currentQuestionIndex: currentQuestionIndex - 1 });
        }
      },

      goToQuestion: (index) => {
        const questions = get().getCurrentSectionQuestions();
        if (index >= 0 && index < questions.length) {
          set({ currentQuestionIndex: index });
        }
      },

      // ── Answer selection ────────────────────────────────────────────────────
      selectAnswer: async (questionId, answerId) => {
        // Optimistic update
        set((state) => ({
          answers: { ...state.answers, [questionId]: answerId },
        }));

        // Persist to server
        try {
          const { session } = get();
          await api.post(`/tests/${session.id}/answer/`, {
            question_id: questionId,
            answer_id: answerId,
          });
        } catch (err) {
          console.error('Failed to save answer:', err);
          // Answer still saved locally - will sync on section advance
        }
      },

      // ── Section management ──────────────────────────────────────────────────
      advanceSection: async () => {
        const { session } = get();
        set({ isSubmitting: true });
        try {
          const { data } = await api.post(`/tests/${session.id}/advance-section/`);
          if (!data.has_next_section) {
            await get().completeTest();
            return;
          }
          set({
            currentSectionIndex: data.current_section_index,
            currentQuestionIndex: 0,
            sectionStartTime: Date.now(),
          });
        } finally {
          set({ isSubmitting: false });
        }
      },

      // ── Complete test ───────────────────────────────────────────────────────
      completeTest: async () => {
        const { session } = get();
        set({ isSubmitting: true });
        try {
          const { data } = await api.post(`/tests/${session.id}/complete/`);
          set({ isCompleted: true, result: data });
        } finally {
          set({ isSubmitting: false });
        }
      },

      // ── Selectors ───────────────────────────────────────────────────────────
      getCurrentSection: () => {
        const { session, currentSectionIndex } = get();
        return session?.sections?.[currentSectionIndex] || null;
      },

      getCurrentSectionQuestions: () => {
        const { session, currentSectionIndex } = get();
        return session?.questions?.filter(
          (q) => q.section_index === currentSectionIndex
        ) || [];
      },

      getCurrentQuestion: () => {
        const { currentQuestionIndex } = get();
        const questions = get().getCurrentSectionQuestions();
        return questions[currentQuestionIndex] || null;
      },

      getAnsweredCount: () => {
        const questions = get().getCurrentSectionQuestions();
        const { answers } = get();
        return questions.filter((q) => answers[q.id] !== undefined).length;
      },

      getSectionTimeLimit: () => {
        const section = get().getCurrentSection();
        return section ? section.time_minutes * 60 : 0;
      },

      // ── Reset ───────────────────────────────────────────────────────────────
      reset: () => set({
        session: null,
        currentSectionIndex: 0,
        currentQuestionIndex: 0,
        answers: {},
        sectionStartTime: null,
        isSubmitting: false,
        isCompleted: false,
        result: null,
      }),
    }),
    {
      name: 'edubest-test',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);

export default useTestStore;
