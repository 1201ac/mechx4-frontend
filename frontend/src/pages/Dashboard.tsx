import React from 'react'
import { useAuth } from '../context/AuthContext'

export const Dashboard: React.FC = () => {
  const { user } = useAuth()

  return (
    <div className="space-y-6">
      <div className="bg-white border border-mist-200 rounded-panel p-6 shadow-sm">
        <h1 className="text-xl font-bold text-ink-900 mb-2">Welcome to NER-Logix</h1>
        <p className="text-ink-600 text-sm">
          Logistics and Accessibility Management Platform for the North Eastern Region.
        </p>
        <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-river-100 text-river-600 text-xs font-semibold rounded-control">
          Logged in as: {user?.name} ({user?.email}) - Role: {user?.role}
        </div>
      </div>
    </div>
  )
}
