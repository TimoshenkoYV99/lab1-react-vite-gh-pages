import { render, screen, fireEvent } from '@testing-library/react'
import { expect, test } from 'vitest'
import Counter from './Counter'

test('renders counter button', () => {
    render(<Counter />)
    const button = screen.getByText(/count is 0/i)
    expect(button).toBeDefined() // или expect(button).toBeTruthy()
})

test('increments counter on click', () => {
    render(<Counter />)
    const button = screen.getByText(/count is 0/i)
    fireEvent.click(button)
    expect(screen.getByText(/count is 1/i)).toBeDefined()
})