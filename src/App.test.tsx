import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import App from './App'

describe('App', () => {
  it('renders application title', () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'UP', database: 'UP' }),
    }))
    render(<App />)
    expect(screen.getByText('NER-Logix')).toBeInTheDocument()
  })
})
