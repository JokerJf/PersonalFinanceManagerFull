import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { AppDataSource } from '../config/database';
import { User } from '../entity/User';
import { Session } from '../entity/Session';
import { ApiError } from '../middleware/errorHandler';
import { authenticate } from '../middleware/auth';

const router = Router();
const userRepository = () => AppDataSource.getRepository(User);
const sessionRepository = () => AppDataSource.getRepository(Session);

// Конфигурация токенов
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'access-secret-key';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'refresh-secret-key';
const ACCESS_TOKEN_EXPIRY = '15m'; // 15 минут
const REFRESH_TOKEN_EXPIRY = '7d'; // 7 дней

// Генерация токенов
function generateAccessToken(userId: number, sessionId: string): string {
  return jwt.sign({ userId, sessionId, type: 'access' }, ACCESS_TOKEN_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
}

function generateRefreshToken(userId: number, sessionId: string): string {
  return jwt.sign({ userId, sessionId, type: 'refresh' }, REFRESH_TOKEN_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });
}

// Создание сессии
async function createSession(userId: number, deviceInfo: string, ipAddress: string): Promise<Session> {
  const refreshToken = generateRefreshToken(userId, '');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const session = sessionRepository().create({
    userId,
    refreshToken: '', // будет обновлён после создания
    deviceInfo,
    ipAddress,
    expiresAt,
    isActive: true,
  });

  await sessionRepository().save(session);
  
  // Обновляем refresh token с ID сессии
  const tokenWithSessionId = jwt.sign(
    { userId, sessionId: session.id, type: 'refresh' }, 
    REFRESH_TOKEN_SECRET, 
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );
  session.refreshToken = tokenWithSessionId;
  await sessionRepository().save(session);

  return session;
}

// Проверка сессии
async function verifySession(sessionId: string): Promise<Session | null> {
  const session = await sessionRepository().findOne({ 
    where: { id: sessionId, isActive: true } 
  });
  
  if (!session) return null;
  if (new Date() > session.expiresAt) {
    session.isActive = false;
    await sessionRepository().save(session);
    return null;
  }
  
  return session;
}

router.post('/register', async (req, res, next) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    const existingUser = await userRepository().findOne({ where: { email } });
    if (existingUser) {
      throw new ApiError('Email already exists', 400);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = userRepository().create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      isActive: true,
    });

    await userRepository().save(user);

    const deviceInfo = req.headers['user-agent'] || 'Unknown';
    const ipAddress = req.ip || req.socket.remoteAddress || 'Unknown';
    const session = await createSession(user.id, deviceInfo, ipAddress);
    const accessToken = generateAccessToken(user.id, session.id);
    const refreshToken = jwt.sign(
      { userId: user.id, sessionId: session.id, type: 'refresh' },
      REFRESH_TOKEN_SECRET,
      { expiresIn: REFRESH_TOKEN_EXPIRY }
    );

    res.status(201).json({
      success: true,
      data: {
        user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName },
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await userRepository().findOne({ where: { email } });
    if (!user) {
      throw new ApiError('Invalid credentials', 401);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new ApiError('Invalid credentials', 401);
    }

    const deviceInfo = req.headers['user-agent'] || 'Unknown';
    const ipAddress = req.ip || req.socket.remoteAddress || 'Unknown';
    const session = await createSession(user.id, deviceInfo, ipAddress);
    const accessToken = generateAccessToken(user.id, session.id);
    const refreshToken = jwt.sign(
      { userId: user.id, sessionId: session.id, type: 'refresh' },
      REFRESH_TOKEN_SECRET,
      { expiresIn: REFRESH_TOKEN_EXPIRY }
    );

    res.json({
      success: true,
      data: {
        user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName },
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      throw new ApiError('Refresh token is required', 400);
    }

    const decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET) as { 
      userId: number; 
      sessionId: string; 
      type: string 
    };

    if (decoded.type !== 'refresh') {
      throw new ApiError('Invalid token type', 401);
    }

    const session = await verifySession(decoded.sessionId);
    if (!session) {
      throw new ApiError('Session expired or invalid', 401);
    }

    const user = await userRepository().findOne({ where: { id: decoded.userId } });
    if (!user) {
      throw new ApiError('User not found', 404);
    }

    const newAccessToken = generateAccessToken(user.id, decoded.sessionId);

    res.json({
      success: true,
      data: {
        accessToken: newAccessToken,
        refreshToken,
      },
    });
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      next(new ApiError('Refresh token expired', 401));
    } else if (error instanceof jwt.JsonWebTokenError) {
      next(new ApiError('Invalid refresh token', 401));
    } else {
      next(error);
    }
  }
});

router.post('/logout', async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      try {
        const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET) as { userId: number };
        // Деактивируем все сессии пользователя
        await sessionRepository().update(
          { userId: decoded.userId, isActive: true },
          { isActive: false }
        );
      } catch (e) {
        // Токен может быть недействителен, но logout всё равно должен работать
      }
    }
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
});

// Выход с конкретной сессии
router.post('/logout-session', authenticate, async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw new ApiError('No token provided', 401);
    }

    const { sessionId } = req.body;
    if (!sessionId) {
      throw new ApiError('Session ID is required', 400);
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET) as { userId: number };

    const session = await sessionRepository().findOne({
      where: { id: sessionId, userId: decoded.userId }
    });

    if (!session) {
      throw new ApiError('Session not found', 404);
    }

    session.isActive = false;
    await sessionRepository().save(session);

    res.json({ success: true, message: 'Session terminated successfully' });
  } catch (error) {
    next(error);
  }
});

// Получение списка сессий пользователя
router.get('/sessions', authenticate, async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw new ApiError('No token provided', 401);
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET) as { userId: number };

    const sessions = await sessionRepository().find({
      where: { userId: decoded.userId },
      order: { createdAt: 'DESC' },
      select: ['id', 'deviceInfo', 'ipAddress', 'expiresAt', 'isActive', 'createdAt']
    });

    res.json({
      success: true,
      data: sessions,
    });
  } catch (error) {
    next(error);
  }
});

// Завершение всех сессий кроме текущей
router.post('/revoke-all-sessions', authenticate, async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw new ApiError('No token provided', 401);
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET) as { userId: number };

    // Деактивируем все сессии пользователя
    await sessionRepository().update(
      { userId: decoded.userId, isActive: true },
      { isActive: false }
    );

    res.json({ success: true, message: 'All sessions revoked successfully' });
  } catch (error) {
    next(error);
  }
});

// Проверка текущего пароля
router.post('/verify-password', authenticate, async (req, res, next) => {
  try {
    const { password } = req.body;
    
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw new ApiError('No token provided', 401);
    }
    
    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET) as { userId: number };
    
    const user = await userRepository().findOne({ where: { id: decoded.userId } });
    if (!user) {
      throw new ApiError('User not found', 404);
    }
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    res.json({ success: isPasswordValid });
  } catch (error) {
    next(error);
  }
});

// Смена пароля
router.post('/change-password', authenticate, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw new ApiError('No token provided', 401);
    }
    
    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET) as { userId: number };
    
    const user = await userRepository().findOne({ where: { id: decoded.userId } });
    if (!user) {
      throw new ApiError('User not found', 404);
    }
    
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      throw new ApiError('Current password is incorrect', 400);
    }
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await userRepository().save(user);
    
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
});

// Обновление профиля пользователя
router.put('/profile', authenticate, async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw new ApiError('No token provided', 401);
    }
    
    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET) as { userId: number };
    
    const user = await userRepository().findOne({ where: { id: decoded.userId } });
    if (!user) {
      throw new ApiError('User not found', 404);
    }
    
    const { firstName, lastName, email } = req.body;
    
    if (email && email !== user.email) {
      const existingUser = await userRepository().findOne({ where: { email } });
      if (existingUser) {
        throw new ApiError('Email already exists', 400);
      }
      user.email = email;
    }
    
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    
    await userRepository().save(user);
    
    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
