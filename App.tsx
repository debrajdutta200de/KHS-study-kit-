import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import IntersectObserver from '@/components/common/IntersectObserver';
import AppLayout from '@/components/layouts/AppLayout';
import routes from './routes';
import { AuthProvider } from '@/contexts/AuthContext';
import { FocusProvider } from '@/contexts/FocusContext';
import { RouteGuard } from '@/components/common/RouteGuard';
import { FocusGuard } from '@/components/common/FocusGuard';
import { Toaster } from '@/components/ui/toaster';

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <FocusProvider>
          <RouteGuard>
            <FocusGuard>
              <IntersectObserver />
              <Routes>
                {routes.map((route, index) => {
                  // Public routes without layout
                  if (route.path === '/login' || route.path === '/onboarding') {
                    return (
                      <Route
                        key={index}
                        path={route.path}
                        element={route.element}
                      />
                    );
                  }
                  // Focus mode without layout
                  if (route.path === '/focus') {
                    return (
                      <Route
                        key={index}
                        path={route.path}
                        element={route.element}
                      />
                    );
                  }
                  // Protected routes with layout
                  return (
                    <Route
                      key={index}
                      path={route.path}
                      element={<AppLayout>{route.element}</AppLayout>}
                    />
                  );
                })}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
              <Toaster />
            </FocusGuard>
          </RouteGuard>
        </FocusProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;
