import { Route, Routes } from 'react-router';
import { Layout } from '@/components/layout';
import { LoginPage } from '@/features/auth/login-page';
import { ProtectedRoute } from '@/features/auth/protected-route';
import { RegisterPage } from '@/features/auth/register-page';
import { CvPage } from '@/features/cvs/cv-page';
import { DashboardPage } from '@/features/cvs/dashboard-page';
import { NewCvPage } from '@/features/cvs/new-cv-page';
import { LandingPage } from '@/pages/landing-page';
import { NotFoundPage } from '@/pages/not-found-page';

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<LandingPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="cvs" element={<DashboardPage />} />
          <Route path="cvs/new" element={<NewCvPage />} />
          <Route path="cvs/:id" element={<CvPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
