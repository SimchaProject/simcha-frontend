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
import { DashboardPage } from './pages/DashboardPage.tsx'
import { WizardPage } from './pages/WizardPage.tsx'
import { InvitePage } from './pages/InvitePage.tsx'
import { SeatingPage } from './pages/SeatingPage.tsx'

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
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/wedding/new"
            element={
              <ProtectedRoute>
                <WizardPage />
              </ProtectedRoute>
            }
          />
          <Route path="/w/:weddingSlug" element={<InvitePage />} />
          <Route path="/weddings/:weddingId/seating" element={<SeatingPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
