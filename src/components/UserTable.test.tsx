import { render, screen, fireEvent} from '@testing-library/react'
import { beforeEach, describe, test, expect, vi } from 'vitest'
import UserTable from './UserTable'

// Мок localStorage
const localStorageMock = (() => {
  let store: { [key: string]: string } = {}
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    }),
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

describe('UserTable с кэшированием', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    globalThis.fetch = vi.fn()
    localStorageMock.clear()
  })

  test('renders button and cache controls', () => {
    render(<UserTable />)
    expect(screen.getByText('Загрузить пользователей')).toBeInTheDocument()
    expect(screen.getByText('Очистить кэш')).toBeInTheDocument()
  })

  test('loads users from API and saves to cache when no cache exists', async () => {
    const mockUsers = [    
      {
        id: 1,
        name: 'Иван Иванов',
        email: 'ivan@example.com',
        phone: '+7 (999) 123-45-67',
        website: 'example.com',
      },
    ]

    const fetchMock = globalThis.fetch as any
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => mockUsers,
    })

    render(<UserTable />)
    fireEvent.click(screen.getByText('Загрузить пользователей'))

    expect(await screen.findByText('Иван Иванов')).toBeInTheDocument()
    expect(screen.getByText('ivan@example.com')).toBeInTheDocument()
    
    // Проверяем сохранение в кэш
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'usersCache',
      expect.stringContaining('timestamp')
    )
  })

  test('loads users from cache when valid cache exists', async () => {
    const mockUsers = [    
      {
        id: 1,
        name: 'Иван Иванов',
        email: 'ivan@example.com',
        phone: '+7 (999) 123-45-67',
        website: 'example.com',
      },
    ]

    const validCache = {
      timestamp: Date.now(), // Свежий кэш
      users: mockUsers
    }

    localStorageMock.setItem('usersCache', JSON.stringify(validCache))

    render(<UserTable />)
    fireEvent.click(screen.getByText('Загрузить пользователей'))

    // Должен сразу показать данные из кэша
    expect(await screen.findByText('Иван Иванов')).toBeInTheDocument()
    expect(screen.getByText(/Данные загружены из кэша/)).toBeInTheDocument()
    
    // Fetch не должен вызываться
    expect(globalThis.fetch).not.toHaveBeenCalled()
  })

  test('loads from API when cache is expired', async () => {
    const expiredCache = {
      timestamp: Date.now() - 70000, // Более 1 минуты назад
      users: [{
        id: 1,
        name: 'Старые данные',
        email: 'old@example.com',
        phone: '123',
        website: 'old.com'
      }]
    }

    const newUsers = [{
      id: 1,
      name: 'Новые данные',
      email: 'new@example.com',
      phone: '456',
      website: 'new.com'
    }]

    localStorageMock.setItem('usersCache', JSON.stringify(expiredCache))

    const fetchMock = globalThis.fetch as any
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => newUsers,
    })

    render(<UserTable />)
    fireEvent.click(screen.getByText('Загрузить пользователей'))

    expect(await screen.findByText('Новые данные')).toBeInTheDocument()
    expect(screen.queryByText('Старые данные')).not.toBeInTheDocument()
    
    // Fetch должен быть вызван
    expect(globalThis.fetch).toHaveBeenCalled()
  })

  test('shows cache notice when loading from cache', async () => {
    const validCache = {
      timestamp: Date.now(),
      users: [{
        id: 1,
        name: 'Тестовый пользователь',
        email: 'test@example.com',
        phone: '123',
        website: 'test.com'
      }]
    }

    localStorageMock.setItem('usersCache', JSON.stringify(validCache))

    render(<UserTable />)
    fireEvent.click(screen.getByText('Загрузить пользователей'))

    expect(await screen.findByText(/Данные загружены из кэша/)).toBeInTheDocument()
  })

  test('clears cache when clear button is clicked', async () => {
    const validCache = {
      timestamp: Date.now(),
      users: [{
        id: 1,
        name: 'Тестовый пользователь',
        email: 'test@example.com',
        phone: '123',
        website: 'test.com'
      }]
    }

    localStorageMock.setItem('usersCache', JSON.stringify(validCache))

    render(<UserTable />)
    
    // Кнопка очистки должна быть активна
    const clearButton = screen.getByText('Очистить кэш')
    expect(clearButton).not.toBeDisabled()

    fireEvent.click(clearButton)
    
    // Проверяем очистку
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('usersCache')
    
    // Кнопка должна стать неактивной
    expect(clearButton).toBeDisabled()
  })

  test('clear cache button is disabled when no cache exists', () => {
    render(<UserTable />)
    expect(screen.getByText('Очистить кэш')).toBeDisabled()
  })

  test('shows error when fetch fails', async () => {
    const fetchMock = globalThis.fetch as any
    fetchMock.mockRejectedValue(new Error('Network error'))

    render(<UserTable />)
    fireEvent.click(screen.getByText('Загрузить пользователей'))

    expect(await screen.findByText(/Ошибка при загрузке данных/)).toBeInTheDocument()
  })
})