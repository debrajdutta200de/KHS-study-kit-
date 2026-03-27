import DashboardPage from '@/pages/DashboardPage';
import UploadPage from '@/pages/UploadPage';
import ExplainPage from '@/pages/ExplainPage';
import QuizPage from '@/pages/QuizPage';
import DoubtsPage from '@/pages/DoubtsPage';
import FlashcardsPage from '@/pages/FlashcardsPage';
import StudyPlanPage from '@/pages/StudyPlanPage';
import DailySchedulePage from '@/pages/DailySchedulePage';
import AnalyticsPage from '@/pages/AnalyticsPage';
import ProfilePage from '@/pages/ProfilePage';
import SettingsPage from '@/pages/SettingsPage';
import LoginPage from '@/pages/LoginPage';
import OnboardingPage from '@/pages/OnboardingPage';
import DeepFocusMode from '@/pages/DeepFocusModeEnhanced';
import ConceptCinema from '@/pages/ConceptCinema';
import LearnAndPlay from '@/pages/LearnAndPlay';
import ParentsPanel from '@/pages/ParentsPanel';
import ParentLoginPage from '@/pages/ParentLoginPage';
import CertificatesPage from '@/pages/CertificatesPage';
import ReviewsPage from '@/pages/ReviewsPage';
import NotFound from '@/pages/NotFound';
import type { ReactNode } from 'react';

interface RouteConfig {
  name: string;
  path: string;
  element: ReactNode;
  visible?: boolean;
}

const routes: RouteConfig[] = [
  {
    name: 'Dashboard',
    path: '/',
    element: <DashboardPage />
  },
  {
    name: 'Dashboard',
    path: '/dashboard',
    element: <DashboardPage />
  },
  {
    name: 'Deep Focus',
    path: '/focus',
    element: <DeepFocusMode />
  },
  {
    name: 'Concept Cinema',
    path: '/cinema',
    element: <ConceptCinema />
  },
  {
    name: 'Learn & Play',
    path: '/games',
    element: <LearnAndPlay />
  },
  {
    name: 'Upload',
    path: '/upload',
    element: <UploadPage />
  },
  {
    name: 'Explain',
    path: '/explain',
    element: <ExplainPage />
  },
  {
    name: 'Quiz',
    path: '/quiz',
    element: <QuizPage />
  },
  {
    name: 'Doubts',
    path: '/doubts',
    element: <DoubtsPage />
  },
  {
    name: 'Flashcards',
    path: '/flashcards',
    element: <FlashcardsPage />
  },
  {
    name: 'Study Plan',
    path: '/study-plan',
    element: <StudyPlanPage />
  },
  {
    name: 'Daily Schedule',
    path: '/daily-schedule',
    element: <DailySchedulePage />
  },
  {
    name: 'Analytics',
    path: '/analytics',
    element: <AnalyticsPage />
  },
  {
    name: 'Certificates',
    path: '/certificates',
    element: <CertificatesPage />
  },
  {
    name: 'Reviews',
    path: '/reviews',
    element: <ReviewsPage />
  },
  {
    name: 'Parent Login',
    path: '/parent-login',
    element: <ParentLoginPage />
  },
  {
    name: 'Parents Panel',
    path: '/parents-panel',
    element: <ParentsPanel />
  },
  {
    name: 'Parents Panel',
    path: '/parents',
    element: <ParentLoginPage />
  },
  {
    name: 'Profile',
    path: '/profile',
    element: <ProfilePage />
  },
  {
    name: 'Settings',
    path: '/settings',
    element: <SettingsPage />
  },
  {
    name: 'Login',
    path: '/login',
    element: <LoginPage />
  },
  {
    name: 'Onboarding',
    path: '/onboarding',
    element: <OnboardingPage />
  },
  {
    name: 'Not Found',
    path: '*',
    element: <NotFound />
  }
];

export default routes;
