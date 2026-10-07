import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { RoleGuard } from './components/RoleGuard'
import { AppShell } from './components/AppShell'
import { Landing } from './pages/Landing'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { Dashboard } from './pages/Dashboard'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route
            path="/dashboard"
            element={
              <RoleGuard>
                <AppShell>
                  <Dashboard />
                </AppShell>
              </RoleGuard>
            }
          />

          <Route
            path="/map"
            element={
              <RoleGuard>
                <AppShell>
                  <Dashboard />
                </AppShell>
              </RoleGuard>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
