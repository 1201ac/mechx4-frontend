import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { RoleGuard } from './components/RoleGuard'
import { AppShell } from './components/AppShell'
import { Landing } from './pages/Landing'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { Dashboard } from './pages/Dashboard'
import { MapPage } from './pages/MapPage'
import { RoadsPage } from './pages/RoadsPage'
import { WeatherPage } from './pages/WeatherPage'
import { RoutePlannerPage } from './pages/RoutePlannerPage'
import { VehiclesPage } from './pages/VehiclesPage'
import { ShipmentsPage } from './pages/ShipmentsPage'
import { FieldReportPage } from './pages/FieldReportPage'
import { PendingReportsPage } from './pages/PendingReportsPage'
import { IncidentsPage } from './pages/IncidentsPage'
import { AlertsPage } from './pages/AlertsPage'
import { NotificationsPage } from './pages/NotificationsPage'
import { DriverPage } from './pages/DriverPage'
import { UserManagementPage } from './pages/admin/UserManagementPage'
import { RuleConfigPage } from './pages/admin/RuleConfigPage'
import { ApiKeysPage } from './pages/admin/ApiKeysPage'
import { AuditLogPage } from './pages/admin/AuditLogPage'
import { DemoToolsPage } from './pages/admin/DemoToolsPage'

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
                  <MapPage />
                </AppShell>
              </RoleGuard>
            }
          />

          <Route
            path="/roads"
            element={
              <RoleGuard>
                <AppShell>
                  <RoadsPage />
                </AppShell>
              </RoleGuard>
            }
          />

          <Route
            path="/weather"
            element={
              <RoleGuard>
                <AppShell>
                  <WeatherPage />
                </AppShell>
              </RoleGuard>
            }
          />

          <Route
            path="/planner"
            element={
              <RoleGuard>
                <AppShell>
                  <RoutePlannerPage />
                </AppShell>
              </RoleGuard>
            }
          />

          <Route
            path="/vehicles"
            element={
              <RoleGuard>
                <AppShell>
                  <VehiclesPage />
                </AppShell>
              </RoleGuard>
            }
          />

          <Route
            path="/shipments"
            element={
              <RoleGuard>
                <AppShell>
                  <ShipmentsPage />
                </AppShell>
              </RoleGuard>
            }
          />

          <Route
            path="/field-report"
            element={
              <RoleGuard>
                <AppShell>
                  <FieldReportPage />
                </AppShell>
              </RoleGuard>
            }
          />

          <Route
            path="/pending-reports"
            element={
              <RoleGuard>
                <AppShell>
                  <PendingReportsPage />
                </AppShell>
              </RoleGuard>
            }
          />

          <Route
            path="/incidents"
            element={
              <RoleGuard>
                <AppShell>
                  <IncidentsPage />
                </AppShell>
              </RoleGuard>
            }
          />

          <Route
            path="/alerts"
            element={
              <RoleGuard allowedRoles={['MODERATOR', 'ADMIN']}>
                <AppShell>
                  <AlertsPage />
                </AppShell>
              </RoleGuard>
            }
          />

          <Route
            path="/notifications"
            element={
              <RoleGuard>
                <AppShell>
                  <NotificationsPage />
                </AppShell>
              </RoleGuard>
            }
          />

          <Route
            path="/driver"
            element={
              <RoleGuard>
                <AppShell>
                  <DriverPage />
                </AppShell>
              </RoleGuard>
            }
          />

          <Route
            path="/admin/users"
            element={
              <RoleGuard allowedRoles={['ADMIN']}>
                <AppShell>
                  <UserManagementPage />
                </AppShell>
              </RoleGuard>
            }
          />

          <Route
            path="/admin/rules"
            element={
              <RoleGuard allowedRoles={['ADMIN']}>
                <AppShell>
                  <RuleConfigPage />
                </AppShell>
              </RoleGuard>
            }
          />

          <Route
            path="/admin/api-keys"
            element={
              <RoleGuard allowedRoles={['ADMIN']}>
                <AppShell>
                  <ApiKeysPage />
                </AppShell>
              </RoleGuard>
            }
          />

          <Route
            path="/admin/audit"
            element={
              <RoleGuard allowedRoles={['ADMIN']}>
                <AppShell>
                  <AuditLogPage />
                </AppShell>
              </RoleGuard>
            }
          />

          <Route
            path="/admin/demo"
            element={
              <RoleGuard allowedRoles={['ADMIN']}>
                <AppShell>
                  <DemoToolsPage />
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
