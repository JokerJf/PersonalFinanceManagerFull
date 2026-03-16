// Auth API для подключения к backend

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
    token: string;
  };
}

const API_BASE_URL = '/api/auth';

export const authApi = {
  // Вход в систему
  async login(credentials: LoginRequest): Promise<AuthResponse> {
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

    return response.json();
  },

  // Регистрация
  async register(data: RegisterRequest): Promise<AuthResponse> {
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

    return response.json();
  },

  // Выход из системы
  async logout(): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Ошибка выхода');
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

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Ошибка смены пароля' }));
      throw new Error(error.message || 'Ошибка смены пароля');
    }
  },
};

export default authApi;
