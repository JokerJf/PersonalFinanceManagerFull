// Утилиты для определения режима работы приложения

// Режим работы: 'development' | 'production'
// В development можно использовать моковые данные
// В production - обязательная авторизация
export type AppMode = 'development' | 'production';

// Получаем режим из переменной окружения
// По умолчанию - development
export const getAppMode = (): AppMode => {
  const mode = import.meta.env.VITE_APP_MODE || 'development';
  return mode === 'production' ? 'production' : 'development';
};

// Проверка - работаем ли мы в production режиме
export const isProduction = (): boolean => {
  return getAppMode() === 'production';
};

// Проверка - работаем ли мы в development режиме
export const isDevelopment = (): boolean => {
  return getAppMode() === 'development';
};

// Базовый URL API
export const getApiBaseUrl = (): string => {
  // Используем значение из env или по умолчанию /api
  return import.meta.env.VITE_API_BASE_URL || '/api';
};

// Проверка, нужно ли использовать моковые данные
// Моковые данные используются только в development режиме
// когда VITE_USE_MOCK_DATA=true
export const shouldUseMockData = (): boolean => {
  // Если явно указано использовать моковые данные
  const useMockData = import.meta.env.VITE_USE_MOCK_DATA;
  
  // В production режиме - никогда не используем моковые данные
  if (isProduction()) {
    return false;
  }
  
  // В development режиме - проверяем переменную
  if (useMockData !== undefined) {
    return useMockData === 'true';
  }
  
  // По умолчанию в development используем моковые данные
  return true;
};

// Получить задержку для моковых данных (в миллисекундах)
export const getMockDelay = (): number => {
  const delay = import.meta.env.VITE_MOCK_DELAY;
  if (delay) {
    const parsed = parseInt(delay);
    return isNaN(parsed) ? 1000 : parsed;
  }
  return 1000;
};
