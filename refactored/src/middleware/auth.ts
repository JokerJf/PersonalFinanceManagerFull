import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppDataSource } from '../config/database';
import { Session } from '../entity/Session';

export interface AuthRequest extends Request {
  userId?: number;
  sessionId?: string;
}

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({ success: false, message: 'No token provided' });
      return;
    }

    if (!ACCESS_TOKEN_SECRET) {
      throw new Error('ACCESS_TOKEN_SECRET is not configured');
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET) as {
      userId: number;
      sessionId?: string;
      type: string;
    };

    if (decoded.type !== 'access') {
      res.status(401).json({ success: false, message: 'Invalid token type' });
      return;
    }

    if (decoded.sessionId) {
      const sessionRepo = AppDataSource.getRepository(Session);
      const session = await sessionRepo.findOne({
        where: { id: decoded.sessionId, isActive: true },
      });

      if (!session) {
        res.status(401).json({ success: false, message: 'Session expired or revoked' });
        return;
      }

      if (new Date() > session.expiresAt) {
        session.isActive = false;
        await sessionRepo.save(session);
        res.status(401).json({ success: false, message: 'Session expired' });
        return;
      }

      req.sessionId = session.id;
    }

    req.userId = decoded.userId;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ success: false, message: 'Token expired' });
    } else if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ success: false, message: 'Invalid token' });
    } else {
      next(error);
    }
  }
};
