// Auth API для подключения к backend с refresh token логикой

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface AuthResponse {
  success: boolean;
  data: {
    user: AuthUser;
    accessToken: string;
    refreshToken: string;
  };
}

export interface Session {
  id: string;
  deviceInfo: string;
  ipAddress: string;
  expiresAt: string;
  isActive: boolean;
  createdAt: string;
}

const API_BASE_URL = '/api/auth';

// Хелпер для получения refresh token
function getRefreshToken(): string | null {
  return localStorage.getItem('refresh_token');
}

// Хелпер для сохранения токенов
function setTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem('auth_token', accessToken);
  localStorage.setItem('refresh_token', refreshToken);
}

// Проверка и очистка старых токенов (без sessionId)
export async function validateAndCleanTokens(): Promise<boolean> {
  const accessToken = localStorage.getItem('auth_token');
  const refreshToken = localStorage.getItem('refresh_token');
  
  // Если есть refreshToken - пробуем обновить
  if (refreshToken) {
    try {
      const response = await fetch(`${API_BASE_URL}/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      
      if (response.ok) {
        const json = await response.json();
        if (json.success && json.data) {
          setTokens(json.data.accessToken, json.data.refreshToken);
          return true;
        }
      }
    } catch {
      // Игнорируем ошибки
    }
  }
  
  // Если токены невалидны - очищаем
  localStorage.removeItem('auth_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('auth_user');
  return false;
}

export const authApi = {
  // Вход в систему
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    // Очищаем старые токены перед новым входом
    this.clearAuth();
    
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Ошибка входа' }));
      throw new Error(error.message || 'Ошибка входа');
    }

    const json = await response.json();
    if (json.success && json.data) {
      setTokens(json.data.accessToken, json.data.refreshToken);
      authApi.setUser(json.data.user);
      return json;
    }
    throw new Error('Неверный ответ от сервера');
  },

  // Регистрация
  async register(data: RegisterRequest): Promise<AuthResponse> {
    // Очищаем старые токены перед новой регистрацией
    this.clearAuth();
    
    const response = await fetch(`${API_BASE_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Ошибка регистрации' }));
      throw new Error(error.message || 'Ошибка регистрации');
    }

    const json = await response.json();
    if (json.success && json.data) {
      setTokens(json.data.accessToken, json.data.refreshToken);
      authApi.setUser(json.data.user);
      return json;
    }
    throw new Error('Неверный ответ от сервера');
  },

  // Выход из системы
  async logout(): Promise<void> {
    const token = this.getToken();
    
    // Пробуем определить sessionId из токена
    let sessionId: string | null = null;
    if (token) {
      try {
        const decoded = JSON.parse(atob(token.split('.')[1]));
        sessionId = decoded.sessionId || null;
      } catch {
        sessionId = null;
      }
    }
    
    // Если есть sessionId - удаляем только эту сессию
    if (sessionId) {
      try {
        await fetch(`${API_BASE_URL}/logout-session`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ sessionId }),
        });
      } catch {
        // Игнорируем ошибки
      }
    } else {
      // Нет sessionId (старый токен) - удаляем все сессии
      try {
        await fetch(`${API_BASE_URL}/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });
      } catch {
        // Игнорируем ошибки
      }
    }
    
    // Очищаем токены локально
    this.clearAuth();
  },

  // Обновление токена
  async refreshToken(): Promise<boolean> {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      return false;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: '' }));
        // Если сессия удалена - сразу выходим
        if (errorData.message?.includes('Session')) {
          this.clearAuth();
          window.location.href = '/login';
          return false;
        }
        this.clearAuth();
        return false;
      }

      const json = await response.json();
      if (json.success && json.data) {
        setTokens(json.data.accessToken, json.data.refreshToken);
        return true;
      }
      return false;
    } catch {
      this.clearAuth();
      return false;
    }
  },

  // Сохранение токена в localStorage
  setToken(token: string): void {
    localStorage.setItem('auth_token', token);
  },

  // Получение токена из localStorage
  getToken(): string | null {
    return localStorage.getItem('auth_token');
  },

  // Удаление токена
  removeToken(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
  },

  // Сохранение данных пользователя
  setUser(user: AuthUser): void {
    localStorage.setItem('auth_user', JSON.stringify(user));
  },

  // Получение данных пользователя
  getUser(): AuthUser | null {
    const userStr = localStorage.getItem('auth_user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },

  // Удаление данных пользователя
  removeUser(): void {
    localStorage.removeItem('auth_user');
  },

  // Очистка всех данных авторизации
  clearAuth(): void {
    this.removeToken();
    this.removeUser();
  },

  // Проверка аутентификации
  isAuthenticated(): boolean {
    return !!this.getToken();
  },

  // Обновление профиля пользователя
  async updateProfile(data: { firstName?: string; lastName?: string; email?: string }): Promise<AuthUser> {
    const response = await fetch(`${API_BASE_URL}/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getToken()}`,
      },
      body: JSON.stringify(data),
    });

    // Если сессия удалена - сразу выходим
    if (response.status === 401) {
      const errorData = await response.json().catch(() => ({ message: '' }));
      if (errorData.message?.includes('Session')) {
        this.clearAuth();
        window.location.href = '/login';
        throw new Error('Сессия завершена. Пожалуйста, войдите снова.');
      }
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Ошибка обновления профиля' }));
      throw new Error(error.message || 'Ошибка обновления профиля');
    }

    const json = await response.json();
    if (json.success && json.data) {
      this.setUser(json.data);
      return json.data;
    }
    throw new Error('Неверный ответ от сервера');
  },

  // Запрос на сброс пароля
  async resetPassword(email: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Ошибка сброса пароля' }));
      throw new Error(error.message || 'Ошибка сброса пароля');
    }
  },

  // Проверка текущего пароля
  async verifyCurrentPassword(currentPassword: string): Promise<boolean> {
    const response = await fetch(`${API_BASE_URL}/verify-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getToken()}`,
      },
      body: JSON.stringify({ password: currentPassword }),
    });

    // Если сессия удалена - сразу выходим
    if (response.status === 401) {
      const errorData = await response.json().catch(() => ({ message: '' }));
      if (errorData.message?.includes('Session')) {
        this.clearAuth();
        window.location.href = '/login';
        return false;
      }
    }

    if (!response.ok) {
      return false;
    }

    const json = await response.json();
    return json.success === true;
  },

  // Смена пароля
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getToken()}`,
      },
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    // Если сессия удалена - сразу выходим
    if (response.status === 401) {
      const errorData = await response.json().catch(() => ({ message: '' }));
      if (errorData.message?.includes('Session')) {
        this.clearAuth();
        window.location.href = '/login';
        throw new Error('Сессия завершена. Пожалуйста, войдите снова.');
      }
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Ошибка смены пароля' }));
      throw new Error(error.message || 'Ошибка смены пароля');
    }
  },

  // Получение списка сессий
  async getSessions(): Promise<Session[]> {
    const response = await fetch(`${API_BASE_URL}/sessions`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.getToken()}`,
      },
    });

    // Если сессия удалена - сразу выходим
    if (response.status === 401) {
      const errorData = await response.json().catch(() => ({ message: '' }));
      if (errorData.message?.includes('Session')) {
        this.clearAuth();
        window.location.href = '/login';
        return [];
      }
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Ошибка получения сессий' }));
      throw new Error(error.message || 'Ошибка получения сессий');
    }

    const json = await response.json();
    if (json.success && json.data) {
      return json.data;
    }
    return [];
  },

  // Завершение конкретной сессии
  async logoutSession(sessionId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/logout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getToken()}`,
      },
      body: JSON.stringify({ sessionId }),
    });

    // Если сессия удалена - сразу выходим
    if (response.status === 401) {
      const errorData = await response.json().catch(() => ({ message: '' }));
      if (errorData.message?.includes('Session')) {
        this.clearAuth();
        window.location.href = '/login';
        throw new Error('Сессия завершена. Пожалуйста, войдите снова.');
      }
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Ошибка завершения сессии' }));
      throw new Error(error.message || 'Ошибка завершения сессии');
    }
  },

  // Завершение всех сессий
  async revokeAllSessions(): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/revoke-all-sessions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.getToken()}`,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Ошибка завершения сессий' }));
      throw new Error(error.message || 'Ошибка завершения сессий');
    }
  },
};

export default authApi;
