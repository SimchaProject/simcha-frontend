import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import './components/motifs/motifs.css'
import { AuthProvider } from './auth/AuthContext'
import { ProtectedRoute } from './auth/ProtectedRoute'
import { LandingPage } from './pages/LandingPage.tsx'
import { LoginPage } from './pages/LoginPage.tsx'
import { SignupPage } from './pages/SignupPage.tsx'
import { DashboardLayout } from './pages/dashboard/DashboardLayout.tsx'
import { OverviewPage } from './pages/dashboard/OverviewPage.tsx'
import { GuestsPage } from './pages/dashboard/GuestsPage.tsx'
import { ComingSoonPage } from './pages/dashboard/ComingSoonPage.tsx'
import { SettingsPage } from './pages/dashboard/SettingsPage.tsx'
import { WizardPage } from './pages/WizardPage.tsx'
import { InvitePage } from './pages/InvitePage.tsx'
import { SeatingPage } from './pages/dashboard/SeatingPage.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<OverviewPage />} />
            <Route path="guests" element={<GuestsPage />} />
            <Route path="seating" element={<SeatingPage />} />
            <Route
              path="budget"
              element={
                <ComingSoonPage title="תקציב" description="ניהול תקציב יהיה זמין כאן בקרוב." />
              }
            />
            <Route
              path="vendors"
              element={
                <ComingSoonPage title="ספקים" description="ניהול ספקים יהיה זמין כאן בקרוב." />
              }
            />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
          <Route
            path="/wedding/new"
            element={
              <ProtectedRoute>
                <WizardPage />
              </ProtectedRoute>
            }
          />
          <Route path="/w/:weddingSlug" element={<InvitePage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
