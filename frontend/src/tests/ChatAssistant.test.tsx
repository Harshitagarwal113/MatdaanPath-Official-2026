import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import ChatAssistant from '../components/ChatAssistant'

// Mock global fetch
global.fetch = vi.fn()

describe('ChatAssistant', () => {
  it('renders the FAB button initially', () => {
    render(<ChatAssistant />)
    expect(screen.getByLabelText(/Open Chat Assistant/i)).toBeDefined()
  })

  it('opens the chat window when clicked', async () => {
    render(<ChatAssistant />)
    const fab = screen.getByLabelText(/Open Chat Assistant/i)
    fireEvent.click(fab)
    expect(screen.getByText(/Election Assistant/i)).toBeDefined()
  })

  it('allows typing in the input field', () => {
    render(<ChatAssistant />)
    fireEvent.click(screen.getByLabelText(/Open Chat Assistant/i))
    const input = screen.getByLabelText(/Chat input message/i) as HTMLInputElement
    fireEvent.change(input, { target: { value: 'How to vote?' } })
    expect(input.value).toBe('How to vote?')
  })
})
