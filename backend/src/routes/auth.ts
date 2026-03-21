import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { AppDataSource } from '../config/database';
import { User } from '../entity/User';
import { ApiError } from '../middleware/errorHandler';

const router = Router();
const userRepository = () => AppDataSource.getRepository(User);

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

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      data: {
        user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName },
        token,
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

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      data: {
        user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName },
        token,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/logout', async (req, res, next) => {
  try {
    // Для JWT токенов logout обрабатывается на клиенте
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
});

// Проверка текущего пароля
router.post('/verify-password', async (req, res, next) => {
  try {
    const { password } = req.body;
    
    // Получаем userId из токена
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw new ApiError('No token provided', 401);
    }
    
    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as { userId: number };
    
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
router.post('/change-password', async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // Получаем userId из токена
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw new ApiError('No token provided', 401);
    }
    
    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as { userId: number };
    
    const user = await userRepository().findOne({ where: { id: decoded.userId } });
    if (!user) {
      throw new ApiError('User not found', 404);
    }
    
    // Проверяем текущий пароль
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      throw new ApiError('Current password is incorrect', 400);
    }
    
    // Хешируем новый пароль
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await userRepository().save(user);
    
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
});

// Обновление профиля пользователя
router.put('/profile', async (req, res, next) => {
  try {
    // Получаем userId из токена
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw new ApiError('No token provided', 401);
    }
    
    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as { userId: number };
    
    const user = await userRepository().findOne({ where: { id: decoded.userId } });
    if (!user) {
      throw new ApiError('User not found', 404);
    }
    
    const { firstName, lastName, email } = req.body;
    
    // Если изменяется email, проверяем, что он не занят
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
