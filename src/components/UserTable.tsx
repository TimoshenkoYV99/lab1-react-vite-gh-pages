import React, { useState, useEffect } from 'react';

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
const CACHE_DURATION = 60000; // 1 минута

const UserTable = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFromCache, setIsFromCache] = useState(false);

  const isCacheValid = (cache: CacheData): boolean => {
    return Date.now() - cache.timestamp < CACHE_DURATION;
  };

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
          return; // Используем кэш
        }
      }
    } catch (err) {
      console.error('Ошибка чтения кэша:', err);
    }

    // Загрузка с API
    setLoading(true);
    try {
      const response = await fetch('https://jsonplaceholder.typicode.com/users');
      if (!response.ok) throw new Error('Ошибка загрузки');
      const data: User[] = await response.json();
      setUsers(data);
      
      // Сохраняем в кэш
      const cacheData: CacheData = {
        timestamp: Date.now(),
        users: data
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setLoading(false);
    }
  };

  const clearCache = () => {
    localStorage.removeItem(CACHE_KEY);
    setIsFromCache(false);
    setUsers([]);
  };

  const hasCache = () => {
    return localStorage.getItem(CACHE_KEY) !== null;
  };

  return (
    <div>
      <div>
        <button 
          onClick={loadUsers} 
          disabled={loading}
        >
          {loading ? 'Загрузка...' : 'Загрузить пользователей'}
        </button>
        
        <button 
          onClick={clearCache} 
          disabled={!hasCache()}
        >
          Очистить кэш
        </button>
      </div>

      {isFromCache && (
        <div>⚡ Данные из кэша (актуальны 1 минуту)</div>
      )}

      {error && <div>❌ {error}</div>}

      {users.length > 0 && (
        <table>
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