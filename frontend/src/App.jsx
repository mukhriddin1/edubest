import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import useAuthStore from './store/authStore';

// Lazy-loaded pages for code splitting
const LandingPage = lazy(() => import('./pages/LandingPage'));
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const OTPPage = lazy(() => import('./pages/auth/OTPPage'));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'));

const DashboardPage = lazy(() => import('./pages/dashboard/DashboardPage'));
const TestSelectPage = lazy(() => import('./pages/tests/TestSelectPage'));
const TestEnginePage = lazy(() => import('./pages/tests/TestEnginePage'));
const TestResultPage = lazy(() => import('./pages/tests/TestResultPage'));
const TestHistoryPage = lazy(() => import('./pages/tests/TestHistoryPage'));

const ProfilePage = lazy(() => import('./pages/profile/ProfilePage'));
const AchievementsPage = lazy(() => import('./pages/profile/AchievementsPage'));
const LeaderboardPage = lazy(() => import('./pages/gamification/LeaderboardPage'));

const TeacherDashboard = lazy(() => import('./pages/teacher/TeacherDashboard'));
const TestBuilderPage = lazy(() => import('./pages/teacher/TestBuilderPage'));

const PricingPage = lazy(() => import('./pages/payments/PricingPage'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function RequireAuth({ children, roles }) {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated()) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user?.role)) return <Navigate to="/dashboard" replace />;
  return children;
}

function GuestOnly({ children }) {
  const { isAuthenticated } = useAuthStore();
  if (isAuthenticated()) return <Navigate to="/dashboard" replace />;
  return children;
}

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-sm">EDU BEST загружается...</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />

            {/* Guest only */}
            <Route path="/login" element={<GuestOnly><LoginPage /></GuestOnly>} />
            <Route path="/register" element={<GuestOnly><RegisterPage /></GuestOnly>} />
            <Route path="/verify" element={<OTPPage />} />
            <Route path="/forgot-password" element={<GuestOnly><ForgotPasswordPage /></GuestOnly>} />

            {/* Protected: all authenticated */}
            <Route path="/dashboard" element={<RequireAuth><DashboardPage /></RequireAuth>} />
            <Route path="/tests" element={<RequireAuth><TestSelectPage /></RequireAuth>} />
            <Route path="/tests/:templateId/start" element={<RequireAuth><TestEnginePage /></RequireAuth>} />
            <Route path="/tests/session/:sessionId" element={<RequireAuth><TestEnginePage /></RequireAuth>} />
            <Route path="/tests/result/:sessionId" element={<RequireAuth><TestResultPage /></RequireAuth>} />
            <Route path="/tests/history" element={<RequireAuth><TestHistoryPage /></RequireAuth>} />
            <Route path="/profile" element={<RequireAuth><ProfilePage /></RequireAuth>} />
            <Route path="/achievements" element={<RequireAuth><AchievementsPage /></RequireAuth>} />

            {/* Teacher only */}
            <Route path="/teacher" element={<RequireAuth roles={['teacher', 'admin']}><TeacherDashboard /></RequireAuth>} />
            <Route path="/teacher/tests/new" element={<RequireAuth roles={['teacher', 'admin']}><TestBuilderPage /></RequireAuth>} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1e293b',
              color: '#f8fafc',
              border: '1px solid #334155',
            },
            success: { iconTheme: { primary: '#f59e0b', secondary: '#1e293b' } },
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
