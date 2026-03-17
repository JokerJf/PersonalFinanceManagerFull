import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authApi, LoginRequest, RegisterRequest, LoginAttemptsInfo } from '@/api/auth';
import { isDevelopment } from '@/lib/env';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, LogIn, UserPlus, Loader2, AlertTriangle } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [loginAttemptsInfo, setLoginAttemptsInfo] = useState<LoginAttemptsInfo | null>(null);
  const [isLoadingAttempts, setIsLoadingAttempts] = useState(true);

  // Загрузка информации о попытках входа
  useEffect(() => {
    const fetchLoginAttempts = async () => {
      try {
        const info = await authApi.getLoginAttempts();
        setLoginAttemptsInfo(info);
      } catch (error) {
        // Игнорируем ошибку - просто не показываем счётчик
        console.error('Failed to fetch login attempts:', error);
      } finally {
        setIsLoadingAttempts(false);
      }
    };

    fetchLoginAttempts();
  }, []);

  // Режим определяется один раз при загрузке - это константа
  const isDevMode = isDevelopment();

  // Состояния формы
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isLogin) {
        // Вход
        const loginData: LoginRequest = { email, password };
        const response = await authApi.login(loginData);
        
        // Сохраняем токен и данные пользователя
        authApi.setToken(response.data.token);
        authApi.setUser(response.data.user);
        
        // Перенаправляем на главную страницу
        window.location.href = '/';
      } else {
        // Регистрация
        if (password !== confirmPassword) {
          setError('Пароли не совпадают');
          setIsLoading(false);
          return;
        }

        const registerData: RegisterRequest = { email, password, firstName, lastName };
        const response = await authApi.register(registerData);
        
        // Сохраняем токен и данные пользователя
        authApi.setToken(response.data.token);
        authApi.setUser(response.data.user);
        
        // Перенаправляем на главную страницу
        window.location.href = '/';
      }
    } catch (err: any) {
      // Обновляем информацию о попытках после ошибки
      try {
        const info = await authApi.getLoginAttempts();
        setLoginAttemptsInfo(info);
      } catch {}
      
      // Обработка ошибки rate limit
      if (err.message && err.message.includes('429')) {
        setError('Слишком много попыток входа. Попробуйте позже.');
      } else if (err.message && err.message.includes('неудачных попыток')) {
        setError(err.message);
      } else {
        setError(err instanceof Error ? err.message : 'Произошла ошибка');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setEmail('');
    setPassword('');
    setFirstName('');
    setLastName('');
    setConfirmPassword('');
  };

  const handleSkip = () => {
    // В development режиме - переходим на главную страницу
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background dark:bg-[#0a0c10] p-4">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5 dark:from-primary/10 dark:to-purple-500/10" />
      
      <div className="relative w-full max-w-md">
        {/* Logo/Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground dark:text-white">
            Personal Finance
          </h1>
          <p className="text-sm text-muted-foreground dark:text-white/60 mt-2">
            {isLogin ? 'Вход в систему' : 'Создание аккаунта'}
          </p>
        </div>

        {/* Form Card */}
        <div className="modal-bg rounded-3xl p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error message */}
            {error && (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2">
                <AlertTriangle size={16} />
                {error}
              </div>
            )}

            {/* Login attempts counter */}
            {!isLoadingAttempts && loginAttemptsInfo && loginAttemptsInfo.attempts > 0 && (
              <div className={`p-3 rounded-xl text-sm flex items-center gap-2 ${
                loginAttemptsInfo.isBlocked 
                  ? 'bg-destructive/10 border border-destructive/20 text-destructive' 
                  : 'bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400'
              }`}>
                <AlertTriangle size={16} />
                {loginAttemptsInfo.isBlocked ? (
                  <span>Вход заблокирован. Попробуйте позже.</span>
                ) : (
                  <span>Осталось попыток: {loginAttemptsInfo.remainingAttempts} из {loginAttemptsInfo.maxAttempts}</span>
                )}
              </div>
            )}

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-700 dark:text-white/80">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@mail.com"
                required
                className="input-bg h-12 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/40 focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-700 dark:text-white/80">
                Пароль
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Введите пароль"
                  required
                  className="input-bg h-12 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/40 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/50 hover:text-slate-600 dark:hover:text-white"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Registration fields */}
            {!isLogin && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  {/* First Name */}
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-slate-700 dark:text-white/80">
                      Имя
                    </Label>
                    <Input
                      id="firstName"
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Иван"
                      required={!isLogin}
                      className="input-bg h-12 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/40"
                    />
                  </div>

                  {/* Last Name */}
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-slate-700 dark:text-white/80">
                      Фамилия
                    </Label>
                    <Input
                      id="lastName"
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Петров"
                      required={!isLogin}
                      className="input-bg h-12 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/40"
                    />
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-slate-700 dark:text-white/80">
                    Подтверждение пароля
                  </Label>
                  <Input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Повторите пароль"
                    required={!isLogin}
                    className="input-bg h-12 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/40"
                  />
                </div>
              </>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading || (loginAttemptsInfo !== null && loginAttemptsInfo.isBlocked)}
              className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold flex items-center justify-center gap-2 transition-all"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : loginAttemptsInfo !== null && loginAttemptsInfo.isBlocked ? (
                <>
                  <AlertTriangle size={20} />
                  Вход заблокирован
                </>
              ) : isLogin ? (
                <>
                  <LogIn size={20} />
                  Войти
                </>
              ) : (
                <>
                  <UserPlus size={20} />
                  Зарегистрироваться
                </>
              )}
            </Button>
          </form>

          {/* Toggle Login/Register */}
          <div className="mt-6 text-center">
            <p className="text-sm text-slate-500 dark:text-white/60">
              {isLogin ? 'Нет аккаунта?' : 'Уже есть аккаунт?'}
              <button
                type="button"
                onClick={toggleMode}
                className="ml-2 text-primary hover:text-primary/80 font-medium transition-colors"
              >
                {isLogin ? 'Регистрация' : 'Вход'}
              </button>
            </p>
          </div>
        </div>

        {/* Skip for now - только в development режиме */}
        {isDevMode && (
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={handleSkip}
              className="text-sm text-muted-foreground dark:text-white/40 hover:text-primary transition-colors"
            >
              Продолжить без входа (Dev режим)
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
