import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppDataSource } from '../config/database';
import { Session } from '../entity/Session';

export interface AuthRequest extends Request {
  userId?: number;
  sessionId?: string;
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    // Используем ACCESS_TOKEN_SECRET для верификации
    const secret = process.env.ACCESS_TOKEN_SECRET || 'access-secret-key';

    const decoded = jwt.verify(token, secret) as { userId: number; sessionId?: string; type: string };
    
    // Проверяем что это access токен
    if (decoded.type !== 'access') {
      return res.status(401).json({ message: 'Invalid token type' });
    }
    
    // Проверяем сессию в базе данных
    if (decoded.sessionId) {
      const sessionRepository = AppDataSource.getRepository(Session);
      const session = await sessionRepository.findOne({
        where: { id: decoded.sessionId, isActive: true }
      });
      
      if (!session) {
        return res.status(401).json({ message: 'Session expired or revoked' });
      }
      
      // Проверяем не истёк ли срок сессии
      if (new Date() > session.expiresAt) {
        session.isActive = false;
        await sessionRepository.save(session);
        return res.status(401).json({ message: 'Session expired' });
      }
      
      req.sessionId = session.id;
    }
    
    req.userId = decoded.userId;

    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};
