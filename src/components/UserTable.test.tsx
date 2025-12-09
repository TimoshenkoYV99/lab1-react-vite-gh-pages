import { render, screen, fireEvent } from '@testing-library/react'
import { beforeEach, describe, test, expect, vi } from 'vitest'
import UserTable from './UserTable'

describe('UserTable', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    globalThis.fetch = vi.fn()
  })

  test('loads users and displays them when button is clicked', async () => {
    const mockUsers = [    
      {
        id: 1,
        name: 'Иван Иванов',
        email: 'ivan@example.com',
        phone: '+7 (999) 123-45-67',
        website: 'example.com',
      },
    ]

    // Создайте мок с правильным типом
    const mockFetch = vi.mocked(globalThis.fetch)
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockUsers,
    } as Response)

    render(<UserTable />)
    fireEvent.click(screen.getByText('Загрузить пользователей'))

    expect(await screen.findByText('Иван Иванов')).toBeInTheDocument()
    expect(screen.getByText('ivan@example.com')).toBeInTheDocument()
  })

  test('shows error when fetch fails', async () => {
    const mockFetch = vi.mocked(globalThis.fetch)
    mockFetch.mockRejectedValue(new Error('Network error'))

    render(<UserTable />)
    fireEvent.click(screen.getByText('Загрузить пользователей'))

    expect(await screen.findByText('Ошибка при загрузке')).toBeInTheDocument()
  })
})