import { useEffect, useState } from 'react'

export default function App() {
  const [healthStatus, setHealthStatus] = useState<string>('Checking...')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/health')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((data) => {
        if (data.status === 'UP') {
          setHealthStatus('Backend is up')
        } else {
          setHealthStatus('Backend status: ' + data.status)
        }
      })
      .catch((err) => {
        setError(err.message)
        setHealthStatus('Backend unreachable')
      })
  }, [])

  return (
    <div className="min-h-screen bg-mist-50 flex items-center justify-center p-6">
      <div className="bg-white border border-mist-200 rounded-panel p-8 shadow-floating max-w-md w-full text-center">
        <h1 className="text-2xl font-bold text-ink-900 mb-2">NER-Logix</h1>
        <p className="text-ink-600 text-sm mb-6">
          Logistics and Accessibility Management Platform for the North Eastern Region
        </p>
        <div className="inline-flex items-center px-4 py-2 rounded-control bg-tea-100 text-tea-500 font-medium text-sm">
          <span className="w-2.5 h-2.5 rounded-full bg-tea-500 mr-2 animate-pulse"></span>
          <span>{healthStatus}</span>
        </div>
        {error && (
          <p className="mt-4 text-xs text-rust-600 bg-rust-100 p-2 rounded-control">
            Error: {error}
          </p>
        )}
      </div>
    </div>
  )
}
