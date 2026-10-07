import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { RoleGuard } from './components/RoleGuard'
import { AppShell } from './components/AppShell'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { Dashboard } from './pages/Dashboard'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
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

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
