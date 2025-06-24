/**
 * App Component Tests
 * 
 * Purpose: Test main App component renders correctly
 * 
 * @author AI Agent
 * @created 2025-06-22
 */

import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import App from '../../App'

describe('App', () => {
  it('renders main dashboard', () => {
    render(<App />)
    expect(screen.getByText('Seascape')).toBeInTheDocument()
  })
})