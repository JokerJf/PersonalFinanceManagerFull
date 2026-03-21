import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authApi, LoginRequest, RegisterRequest } from '@/api/auth';
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
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Режим определяется один раз при загрузке - это константа
  const isDevMode = isDevelopment();

  // Состояния формы
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Валидация полей
  const validateField = (name: string, value: string): string => {
    switch (name) {
      case 'email':
        if (!value) return 'Email обязателен';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Введите корректный email';
        break;
      case 'password':
        if (!value) return 'Пароль обязателен';
        if (value.length < 6) return 'Пароль должен быть минимум 6 символов';
        break;
      case 'firstName':
        if (!value) return 'Имя обязательно';
        if (value.length < 1) return 'Имя обязательно';
        break;
      case 'lastName':
        if (!value) return 'Фамилия обязательна';
        if (value.length < 1) return 'Фамилия обязательна';
        break;
      case 'confirmPassword':
        if (!value) return 'Подтверждение пароля обязательно';
        if (value !== password) return 'Пароли не совпадают';
        break;
    }
    return '';
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    setValidationErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Обновляем значение
    if (name === 'email') setEmail(value);
    else if (name === 'password') setPassword(value);
    else if (name === 'firstName') setFirstName(value);
    else if (name === 'lastName') setLastName(value);
    else if (name === 'confirmPassword') setConfirmPassword(value);
    
    // Убираем ошибку валидации при изменении
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!isLogin) {
      errors.email = validateField('email', email);
      errors.password = validateField('password', password);
      errors.firstName = validateField('firstName', firstName);
      errors.lastName = validateField('lastName', lastName);
      errors.confirmPassword = validateField('confirmPassword', confirmPassword);
    } else {
      errors.email = validateField('email', email);
      errors.password = validateField('password', password);
    }
    
    setValidationErrors(errors);
    return !Object.values(errors).some(e => e);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Клиентская валидация
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);

    try {
      if (isLogin) {
        // Вход
        const loginData: LoginRequest = { email, password };
        const response = await authApi.login(loginData);
        
        // Перенаправляем на главную страницу
        window.location.href = '/';
      } else {
        // Регистрация
        const registerData: RegisterRequest = { email, password, firstName, lastName };
        const response = await authApi.register(registerData);
        
        // Перенаправляем на главную страницу
        window.location.href = '/';
      }
    } catch (err) {
      // Ошибка входа или регистрации
      const errorMessage = err instanceof Error ? err.message : 'Произошла ошибка. Попробуйте позже.';
      setError(errorMessage);
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

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-700 dark:text-white/80">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="example@mail.com"
                required
                className={`input-bg h-12 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/40 focus:ring-2 focus:ring-primary ${validationErrors.email ? 'border-destructive focus:ring-destructive' : ''}`}
              />
              {validationErrors.email && (
                <p className="text-xs text-destructive">{validationErrors.email}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-700 dark:text-white/80">
                Пароль {!isLogin && <span className="text-destructive">*</span>}
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Введите пароль"
                  required
                  className={`input-bg h-12 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/40 pr-12 ${validationErrors.password ? 'border-destructive focus:ring-destructive' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/50 hover:text-slate-600 dark:hover:text-white"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {validationErrors.password && (
                <p className="text-xs text-destructive">{validationErrors.password}</p>
              )}
              {!isLogin && !validationErrors.password && password.length > 0 && password.length < 6 && (
                <p className="text-xs text-amber-600">Минимум 6 символов</p>
              )}
            </div>

            {/* Registration fields */}
            {!isLogin && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  {/* First Name */}
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-slate-700 dark:text-white/80">
                      Имя <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      type="text"
                      value={firstName}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder="Иван"
                      required={!isLogin}
                      className={`input-bg h-12 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/40 ${validationErrors.firstName ? 'border-destructive focus:ring-destructive' : ''}`}
                    />
                    {validationErrors.firstName && (
                      <p className="text-xs text-destructive">{validationErrors.firstName}</p>
                    )}
                  </div>

                  {/* Last Name */}
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-slate-700 dark:text-white/80">
                      Фамилия <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      type="text"
                      value={lastName}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder="Петров"
                      required={!isLogin}
                      className={`input-bg h-12 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/40 ${validationErrors.lastName ? 'border-destructive focus:ring-destructive' : ''}`}
                    />
                    {validationErrors.lastName && (
                      <p className="text-xs text-destructive">{validationErrors.lastName}</p>
                    )}
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-slate-700 dark:text-white/80">
                    Подтверждение пароля <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Повторите пароль"
                    required={!isLogin}
                    className={`input-bg h-12 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/40 ${validationErrors.confirmPassword ? 'border-destructive focus:ring-destructive' : ''}`}
                  />
                  {validationErrors.confirmPassword && (
                    <p className="text-xs text-destructive">{validationErrors.confirmPassword}</p>
                  )}
                </div>
              </>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold flex items-center justify-center gap-2 transition-all"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={20} />
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
