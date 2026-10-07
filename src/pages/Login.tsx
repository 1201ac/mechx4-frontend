import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export const Login: React.FC = () => {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const res = (err as { response?: { data?: { message?: string } } }).response
        setError(res?.data?.message || 'Failed to sign in. Please check credentials.')
      } else {
        setError('An unexpected error occurred.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const fillDemo = (demoEmail: string) => {
    setEmail(demoEmail)
    setPassword('Demo@1234')
  }

  return (
    <div className="min-h-screen bg-mist-50 flex items-center justify-center p-6">
      <div className="bg-white border border-mist-200 rounded-panel p-8 shadow-floating max-w-md w-full">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-river-600 mb-1">NER-Logix</h1>
          <p className="text-ink-600 text-sm">Sign in to your platform account</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rust-100 text-rust-600 text-xs rounded-control font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ink-600 mb-1">Email address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@nerlogix.com"
              className="w-full px-3 py-2 border border-mist-200 rounded-control text-sm focus:outline-none focus:ring-2 focus:ring-river-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-600 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 border border-mist-200 rounded-control text-sm focus:outline-none focus:ring-2 focus:ring-river-600"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 bg-river-600 text-white font-semibold text-sm rounded-control hover:bg-river-700 transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-mist-200">
          <p className="text-xs font-semibold text-ink-400 mb-2">Demo accounts (password: Demo@1234)</p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => fillDemo('admin@nerlogix.com')}
              className="px-2 py-1.5 bg-mist-100 hover:bg-mist-200 text-ink-900 rounded text-xs font-medium truncate"
            >
              Admin
            </button>
            <button
              type="button"
              onClick={() => fillDemo('moderator@nerlogix.com')}
              className="px-2 py-1.5 bg-mist-100 hover:bg-mist-200 text-ink-900 rounded text-xs font-medium truncate"
            >
              Moderator
            </button>
            <button
              type="button"
              onClick={() => fillDemo('user@nerlogix.com')}
              className="px-2 py-1.5 bg-mist-100 hover:bg-mist-200 text-ink-900 rounded text-xs font-medium truncate"
            >
              User/Driver
            </button>
          </div>
        </div>

        <div className="mt-4 text-center">
          <Link to="/register" className="text-xs text-river-600 font-medium hover:underline">
            Don't have an account? Register here
          </Link>
        </div>
      </div>
    </div>
  )
}
