import { Router } from 'express';
import { AppDataSource } from '../config/database';
import { Notification } from '../entity/Notification';
import { authenticate, AuthRequest } from '../middleware/auth';
import { ApiError } from '../middleware/errorHandler';

const router = Router();
router.use(authenticate);

router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const notificationRepository = AppDataSource.getRepository(Notification);
    const notifications = await notificationRepository.find({ 
      where: { userId: req.userId }, 
      order: { createdAt: 'DESC' } 
    });
    res.json({ success: true, data: notifications });
  } catch (error) {
    next(error);
  }
});

router.put('/:id/read', async (req: AuthRequest, res, next) => {
  try {
    const notificationRepository = AppDataSource.getRepository(Notification);
    const notification = await notificationRepository.findOne({ where: { id: parseInt(req.params.id), userId: req.userId } });
    if (!notification) throw new ApiError('Notification not found', 404);
    notification.isRead = true;
    await notificationRepository.save(notification);
    res.json({ success: true, data: notification });
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req: AuthRequest, res, next) => {
  try {
    const { title, message, type } = req.body;
    const notificationRepository = AppDataSource.getRepository(Notification);
    
    const notification = notificationRepository.create({
      title,
      message,
      type: type || 'info',
      userId: req.userId,
      isRead: false
    });
    
    await notificationRepository.save(notification);
    res.json({ success: true, data: notification });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req: AuthRequest, res, next) => {
  try {
    const notificationRepository = AppDataSource.getRepository(Notification);
    const result = await notificationRepository.delete({ id: parseInt(req.params.id), userId: req.userId });
    if (result.affected === 0) throw new ApiError('Notification not found', 404);
    res.json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    next(error);
  }
});

export default router;
