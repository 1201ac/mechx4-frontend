import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export const Register: React.FC = () => {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [language, setLanguage] = useState('en')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      await register(email, password, name, language)
      navigate('/dashboard')
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const res = (err as { response?: { data?: { message?: string } } }).response
        setError(res?.data?.message || 'Registration failed.')
      } else {
        setError('An unexpected error occurred.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-mist-50 flex items-center justify-center p-6">
      <div className="bg-white border border-mist-200 rounded-panel p-8 shadow-floating max-w-md w-full">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-river-600 mb-1">NER-Logix</h1>
          <p className="text-ink-600 text-sm">Create a new field user account</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rust-100 text-rust-600 text-xs rounded-control font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ink-600 mb-1">Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full Name"
              className="w-full px-3 py-2 border border-mist-200 rounded-control text-sm focus:outline-none focus:ring-2 focus:ring-river-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-600 mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              className="w-full px-3 py-2 border border-mist-200 rounded-control text-sm focus:outline-none focus:ring-2 focus:ring-river-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-600 mb-1">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              className="w-full px-3 py-2 border border-mist-200 rounded-control text-sm focus:outline-none focus:ring-2 focus:ring-river-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-600 mb-1">Preferred Language</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full px-3 py-2 border border-mist-200 rounded-control text-sm focus:outline-none focus:ring-2 focus:ring-river-600 bg-white"
            >
              <option value="en">English</option>
              <option value="hi">Hindi (हिंदी)</option>
              <option value="as">Assamese (অসমীয়া)</option>
              <option value="bn">Bengali (বাংলা)</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 bg-river-600 text-white font-semibold text-sm rounded-control hover:bg-river-700 transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <Link to="/login" className="text-xs text-river-600 font-medium hover:underline">
            Already have an account? Sign in
          </Link>
        </div>
      </div>
    </div>
  )
}
