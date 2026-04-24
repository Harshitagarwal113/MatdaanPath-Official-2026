import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import EligibilityChecker from '../components/EligibilityChecker'

// Mock the API base URL
vi.mock('../lib/api', () => ({
  default: 'http://localhost:8000'
}))

// Mock fetch
const mockRules = [
  { id: 1, question: "Are you 18?", requirement_description: "Legal age to vote" },
  { id: 2, question: "Are you a citizen?", requirement_description: "Indian citizenship" }
]

global.fetch = vi.fn()

describe('EligibilityChecker', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockRules
    })
  })

  it('renders correctly after fetching rules', async () => {
    render(<EligibilityChecker />)
    
    await waitFor(() => {
      expect(screen.getByText(/Are you 18\?/i)).toBeDefined()
      expect(screen.getByText(/Are you a citizen\?/i)).toBeDefined()
    })
  })

  it('shows eligibility result when all questions are answered', async () => {
    render(<EligibilityChecker />)
    
    await waitFor(() => screen.getByText(/Are you 18\?/i))
    
    const yesButtons = screen.getAllByText(/Yes/i)
    fireEvent.click(yesButtons[0])
    fireEvent.click(yesButtons[1])
    
    await waitFor(() => {
      expect(screen.getByText(/Likely Eligible/i)).toBeDefined()
    })
  })

  it('shows ineligibility status if any answer is No', async () => {
    render(<EligibilityChecker />)
    
    await waitFor(() => screen.getByText(/Are you 18\?/i))
    
    const yesButtons = screen.getAllByText(/Yes/i)
    const noButtons = screen.getAllByText(/No/i)
    
    fireEvent.click(yesButtons[0])
    fireEvent.click(noButtons[1])
    
    await waitFor(() => {
      expect(screen.getByText(/Ineligible Status/i)).toBeDefined()
    })
  })
})
