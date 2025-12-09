import React, { useState, useEffect } from 'react';
import './UserTable.css';

interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  website: string;
}

interface CacheData {
  timestamp: number;
  users: User[];
}

const CACHE_KEY = 'usersCache';
const CACHE_DURATION = 60000; // 1 минута в миллисекундах

const UserTable = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFromCache, setIsFromCache] = useState(false);

  // Проверка валидности кэша
  const isCacheValid = (cache: CacheData): boolean => {
    const now = Date.now();
    return now - cache.timestamp < CACHE_DURATION;
  };

  // Загрузка пользователей
  const loadUsers = async () => {
    setError(null);
    setIsFromCache(false);

    // Проверка кэша
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const cacheData: CacheData = JSON.parse(cached);
        if (isCacheValid(cacheData)) {
          setUsers(cacheData.users);
          setIsFromCache(true);
          return; // Используем кэш, не делаем запрос
        }
      }
    } catch (err) {
      console.error('Ошибка при чтении кэша:', err);
    }

    // Загрузка с API
    setLoading(true);
    try {
      const response = await fetch('https://jsonplaceholder.typicode.com/users');
      if (!response.ok) {
        throw new Error('Ошибка при загрузке данных');
      }
      const data: User[] = await response.json();
      setUsers(data);
      
      // Сохранение в кэш
      const cacheData: CacheData = {
        timestamp: Date.now(),
        users: data
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
    } finally {
      setLoading(false);
    }
  };

  // Очистка кэша
  const clearCache = () => {
    localStorage.removeItem(CACHE_KEY);
    setIsFromCache(false);
    setUsers([]);
  };

  // Проверка существования кэша
  const hasCache = () => {
    return localStorage.getItem(CACHE_KEY) !== null;
  };

  return (
    <div className="user-table-container">
      <div className="controls">
        <button 
          onClick={loadUsers} 
          disabled={loading}
          className="load-button"
        >
          {loading ? 'Загрузка...' : 'Загрузить пользователей'}
        </button>
        
        <button 
          onClick={clearCache} 
          disabled={!hasCache()}
          className="clear-cache-button"
        >
          Очистить кэш
        </button>
      </div>

      {isFromCache && (
        <div className="cache-notice">
          ⚡ Данные загружены из кэша (актуальность до 1 минуты)
        </div>
      )}

      {error && (
        <div className="error-message">
          ❌ {error}
        </div>
      )}

      {users.length > 0 && (
        <table className="user-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Имя</th>
              <th>Email</th>
              <th>Телефон</th>
              <th>Веб-сайт</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.phone}</td>
                <td>{user.website}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default UserTable;