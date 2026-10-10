import React from 'react'
import { NavLink } from 'react-router-dom'
import {
  MapPin, LayoutDashboard, CloudRain, Navigation,
  AlertTriangle, ShieldAlert, Truck, Package,
  FileText, Clock, Users, Sliders, Key, History, Wrench, Settings
} from 'lucide-react'
import { useAuth, Role } from '../context/AuthContext'

interface NavItem {
  label: string
  to: string
  icon: React.ElementType
  roles?: Role[]
}

interface NavGroup {
  title: string
  items: NavItem[]
}

export const Sidebar: React.FC = () => {
  const { user } = useAuth()
  if (!user) return null

  const userRole = user.role

  const groups: NavGroup[] = [
    {
      title: 'Overview',
      items: [
        { label: 'Live Map', to: '/map', icon: MapPin },
        { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
        { label: 'Weather', to: '/weather', icon: CloudRain },
        { label: 'Route Planner', to: '/planner', icon: Navigation },
      ],
    },
    {
      title: 'Operations',
      items: [
        { label: 'Road Status', to: '/roads', icon: AlertTriangle },
        { label: 'Incidents Log', to: '/incidents', icon: ShieldAlert },
        { label: 'Shipments', to: '/shipments', icon: Package },
        { label: 'Vehicles', to: '/vehicles', icon: Truck },
        { label: 'Alerts', to: '/alerts', icon: AlertTriangle, roles: ['MODERATOR', 'ADMIN'] },
        { label: 'Driver Mode', to: '/driver', icon: Truck },
      ],
    },
    {
      title: 'Field & User',
      items: [
        { label: 'Field Report', to: '/field-report', icon: FileText },
        { label: 'Pending Queue', to: '/pending-reports', icon: Clock },
        { label: 'Settings', to: '/settings', icon: Settings },
      ],
    },
    {
      title: 'Admin',
      items: [
        { label: 'User Management', to: '/admin/users', icon: Users, roles: ['ADMIN'] },
        { label: 'Rule Config', to: '/admin/rules', icon: Sliders, roles: ['ADMIN'] },
        { label: 'API Keys', to: '/admin/api-keys', icon: Key, roles: ['ADMIN'] },
        { label: 'Audit Log', to: '/admin/audit', icon: History, roles: ['ADMIN'] },
        { label: 'Demo Tools', to: '/admin/demo', icon: Wrench, roles: ['ADMIN'] },
      ],
    },
  ]

  return (
    <aside className="w-64 bg-white border-r border-mist-200 flex flex-col h-screen sticky top-0 select-none">
      <div className="p-4 border-b border-mist-200 flex items-center justify-between">
        <div>
          <span className="font-heading font-bold text-lg text-river-600">NER-Logix</span>
          <span className="block text-xs text-ink-400 font-mono">Platform v1.0</span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-6">
        {groups.map((group) => {
          const visibleItems = group.items.filter(
            (item) => !item.roles || item.roles.includes(userRole)
          )
          if (visibleItems.length === 0) return null

          return (
            <div key={group.title}>
              <div className="px-3 text-xs font-semibold text-ink-400 uppercase tracking-wider mb-2">
                {group.title}
              </div>
              <div className="space-y-1">
                {visibleItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-control text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-river-100 text-river-600 font-semibold'
                            : 'text-ink-600 hover:bg-mist-100 hover:text-ink-900'
                        }`
                      }
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </NavLink>
                  )
                })}
              </div>
            </div>
          )
        })}
      </nav>

      <div className="p-4 border-t border-mist-200 bg-mist-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-river-600 text-white font-bold flex items-center justify-center text-xs">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-ink-900 truncate">{user.name}</p>
            <span className="inline-block px-1.5 py-0.5 text-[10px] font-bold rounded bg-mist-200 text-ink-600">
              {user.role}
            </span>
          </div>
        </div>
      </div>
    </aside>
  )
}
