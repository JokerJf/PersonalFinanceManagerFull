import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { authApi } from '@/api/auth';
import { isProduction } from '@/lib/env';
import { Loader2 } from 'lucide-react';

const ProtectedRoute = () => {
  const location = useLocation();
  
  // Проверяем наличие токена
  const isAuthenticated = authApi.isAuthenticated();
  
  // В production режиме - обязательна авторизация для всех защищённых маршрутов
  if (isProduction()) {
    if (!isAuthenticated) {
      // Перенаправляем на страницу входа с return url
      return <Navigate to="/login" state={{ from: location }} replace />;
    }
  } else {
    // В development режиме - также проверяем авторизацию, чтобы можно было тестировать поведение
    // Если нужно временно отключить защиту в dev, можно закомментировать эту проверку
    if (!isAuthenticated) {
      return <Navigate to="/login" state={{ from: location }} replace />;
    }
  }
  
  // Если пользователь авторизован - рендерим дочерние маршруты
  return <Outlet />;
};

export default ProtectedRoute;
