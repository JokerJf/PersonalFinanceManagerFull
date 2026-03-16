import { Router } from 'express';
import { AppDataSource } from '../config/database';
import { FamilyRequest, FamilyRequestStatus, FamilyRequestType } from '../entity/FamilyRequest';
import { User } from '../entity/User';
import { FamilyGroup } from '../entity/FamilyGroup';
import { Notification } from '../entity/Notification';
import { authenticate, AuthRequest } from '../middleware/auth';
import { ApiError } from '../middleware/errorHandler';
import { Not, IsNull } from 'typeorm';

const router = Router();
router.use(authenticate);

// Создать семейную группу
router.post('/create-group', async (req: AuthRequest, res, next) => {
  try {
    const { name } = req.body;
    
    if (!name) {
      throw new ApiError('Group name is required', 400);
    }

    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ where: { id: req.userId } });

    if (!user) {
      throw new ApiError('User not found', 404);
    }

    // Проверяем, не состоит ли пользователь уже в группе
    if (user.familyGroupId) {
      throw new ApiError('You are already in a family group. Leave first to create a new one.', 400);
    }

    // Проверяем, есть ли уже исходящий запрос на создание группы
    const familyRequestRepository = AppDataSource.getRepository(FamilyRequest);
    const existingCreateRequest = await familyRequestRepository.findOne({
      where: { 
        senderId: req.userId, 
        type: FamilyRequestType.CREATE_GROUP,
        status: FamilyRequestStatus.PENDING 
      }
    });

    if (existingCreateRequest) {
      throw new ApiError('You already have a pending group creation request', 400);
    }

    // Создаем группу
    const familyGroupRepository = AppDataSource.getRepository(FamilyGroup);
    const inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase();
    
    const newGroup = familyGroupRepository.create({
      name,
      leaderId: req.userId,
      inviteCode
    });
    
    await familyGroupRepository.save(newGroup);

    // Обновляем пользователя
    user.familyGroupId = newGroup.id;
    await userRepository.save(user);

    res.json({ 
      success: true, 
      data: {
        id: newGroup.id,
        name: newGroup.name,
        leaderId: newGroup.leaderId,
        inviteCode: newGroup.inviteCode,
        isLeader: true,
        isInGroup: true,
        members: [{
          id: user.id,
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          avatar: user.firstName.charAt(0).toUpperCase(),
          isLeader: true
        }]
      }, 
      message: 'Family group created successfully' 
    });
  } catch (error) {
    next(error);
  }
});

// Присоединиться к группе по коду приглашения
router.post('/join-group', async (req: AuthRequest, res, next) => {
  try {
    const { inviteCode } = req.body;
    
    if (!inviteCode) {
      throw new ApiError('Invite code is required', 400);
    }

    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ where: { id: req.userId } });

    if (!user) {
      throw new ApiError('User not found', 404);
    }

    // Проверяем, не состоит ли пользователь уже в группе
    if (user.familyGroupId) {
      throw new ApiError('You are already in a family group. Leave first to join another one.', 400);
    }

    // Ищем группу по коду приглашения
    const familyGroupRepository = AppDataSource.getRepository(FamilyGroup);
    const group = await familyGroupRepository.findOne({ where: { inviteCode: inviteCode.toUpperCase() } });

    if (!group) {
      throw new ApiError('Invalid invite code', 404);
    }

    // Проверяем, не подавал ли уже пользователь заявку
    const familyRequestRepository = AppDataSource.getRepository(FamilyRequest);
    const existingRequest = await familyRequestRepository.findOne({
      where: {
        senderId: req.userId,
        familyGroupId: group.id,
        status: FamilyRequestStatus.PENDING
      }
    });

    if (existingRequest) {
      throw new ApiError('You already have a pending request to join this group', 400);
    }

    // Создаем запрос на присоединение к группе
    const newRequest = familyRequestRepository.create({
      senderId: req.userId,
      type: FamilyRequestType.JOIN_GROUP,
      familyGroupId: group.id,
      status: FamilyRequestStatus.PENDING
    });

    await familyRequestRepository.save(newRequest);

    // Отправляем уведомление лидеру группы
    const sender = await userRepository.findOne({ where: { id: req.userId } });
    const notificationRepository = AppDataSource.getRepository(Notification);
    
    const notification = notificationRepository.create({
      message: `${sender?.firstName} ${sender?.lastName} хочет присоединиться к вашей семейной группе "${group.name}"`,
      type: 'family_request',
      userId: group.leaderId,
      title: 'Запрос на присоединение',
      relatedRequestId: newRequest.id
    });
    
    await notificationRepository.save(notification);

    res.json({ 
      success: true, 
      data: { requestId: newRequest.id, groupName: group.name },
      message: 'Join request sent successfully' 
    });
  } catch (error) {
    next(error);
  }
});

// Получить статус семейной группы
router.get('/status', async (req: AuthRequest, res, next) => {
  try {
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ 
      where: { id: req.userId },
      relations: ['familyGroup']
    });

    if (!user) {
      throw new ApiError('User not found', 404);
    }

    if (!user.familyGroupId || !user.familyGroup) {
      return res.json({
        success: true,
        data: {
          isInGroup: false,
          isLeader: false,
          groupName: null,
          groupId: null,
          inviteCode: null,
          members: []
        }
      });
    }

    const familyGroupRepository = AppDataSource.getRepository(FamilyGroup);
    const group = await familyGroupRepository.findOne({
      where: { id: user.familyGroupId },
      relations: ['members']
    });

    if (!group) {
      return res.json({
        success: true,
        data: {
          isInGroup: false,
          isLeader: false,
          groupName: null,
          groupId: null,
          inviteCode: null,
          members: []
        }
      });
    }

    const isLeader = group.leaderId === req.userId;

    const members = group.members.map(member => ({
      id: member.id,
      name: `${member.firstName} ${member.lastName}`,
      email: member.email,
      avatar: member.firstName.charAt(0).toUpperCase(),
      isLeader: member.id === group.leaderId
    }));

    res.json({
      success: true,
      data: {
        isInGroup: true,
        isLeader,
        groupName: group.name,
        groupId: group.id,
        inviteCode: group.inviteCode,
        members
      }
    });
  } catch (error) {
    next(error);
  }
});

// Получить входящие запросы на присоединение (для лидера)
// Показываем только запросы от обычных пользователей, которые хотят присоединиться по коду
// Не показываем приглашения, отправленные лидером по email
router.get('/incoming-requests', async (req: AuthRequest, res, next) => {
  try {
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ where: { id: req.userId } });

    if (!user || !user.familyGroupId) {
      throw new ApiError('You are not a leader of any group', 400);
    }

    // Проверяем, является ли пользователь лидером
    const familyGroupRepository = AppDataSource.getRepository(FamilyGroup);
    const group = await familyGroupRepository.findOne({ where: { id: user.familyGroupId } });

    if (!group || group.leaderId !== req.userId) {
      throw new ApiError('Only group leader can view incoming requests', 403);
    }

    const familyRequestRepository = AppDataSource.getRepository(FamilyRequest);
    const requests = await familyRequestRepository.find({
      where: { 
        familyGroupId: group.id,
        type: FamilyRequestType.JOIN_GROUP,
        status: FamilyRequestStatus.PENDING,
        // Исключаем запросы, где отправитель - сам лидер (это приглашения по email)
        senderId: Not(req.userId)
      },
      relations: ['sender'],
      order: { createdAt: 'DESC' }
    });

    const requestsWithSender = requests.map(req => ({
      id: req.id,
      senderId: req.senderId,
      senderName: req.sender ? `${req.sender.firstName} ${req.sender.lastName}` : 'Unknown',
      senderEmail: req.sender?.email,
      status: req.status,
      createdAt: req.createdAt
    }));

    res.json({ success: true, data: requestsWithSender });
  } catch (error) {
    next(error);
  }
});

// Принять запрос на присоединение (для лидера) или принять приглашение (для получателя)
router.put('/requests/:id/accept', async (req: AuthRequest, res, next) => {
  try {
    const requestId = parseInt(req.params.id);
    const familyRequestRepository = AppDataSource.getRepository(FamilyRequest);
    const userRepository = AppDataSource.getRepository(User);

    const request = await familyRequestRepository.findOne({
      where: { 
        id: requestId,
        type: FamilyRequestType.JOIN_GROUP,
        status: FamilyRequestStatus.PENDING 
      },
      relations: ['sender', 'familyGroup']
    });

    if (!request) {
      throw new ApiError('Request not found', 404);
    }

    // Проверяем: либо текущий пользователь - лидер группы, либо он - получатель приглашения
    const currentUser = await userRepository.findOne({ where: { id: req.userId } });
    if (!currentUser) {
      throw new ApiError('User not found', 404);
    }

    // Получатель приглашения (обычный пользователь, которому отправили приглашение)
    if (request.recipientId && request.recipientId === req.userId) {
      // Принимаем приглашение - добавляем пользователя в группу
      request.status = FamilyRequestStatus.ACCEPTED;
      request.respondedAt = new Date();
      await familyRequestRepository.save(request);

      currentUser.familyGroupId = request.familyGroupId;
      await userRepository.save(currentUser);

      // Отправляем уведомление лидеру
      const notificationRepository = AppDataSource.getRepository(Notification);
      const notification = notificationRepository.create({
        message: `${currentUser.firstName} ${currentUser.lastName} принял(а) ваше приглашение в группу`,
        type: 'success',
        userId: request.senderId,
        title: 'Приглашение принято'
      });
      await notificationRepository.save(notification);

      res.json({ success: true, message: 'Invitation accepted' });
      return;
    }

    // Лидер группы принимает заявку на присоединение
    if (!currentUser.familyGroupId || currentUser.familyGroupId !== request.familyGroupId) {
      throw new ApiError('You are not authorized to accept this request', 403);
    }

    const group = request.familyGroup;
    if (group.leaderId !== req.userId) {
      throw new ApiError('Only group leader can accept requests', 403);
    }

    // Обновляем статус запроса
    request.status = FamilyRequestStatus.ACCEPTED;
    request.respondedAt = new Date();
    await familyRequestRepository.save(request);

    // Добавляем пользователя в группу
    const sender = request.sender;
    sender.familyGroupId = group.id;
    await userRepository.save(sender);

    // Отправляем уведомление
    const notificationRepository = AppDataSource.getRepository(Notification);
    const notification = notificationRepository.create({
      message: `Ваш запрос на присоединение к группе "${group.name}" был принят`,
      type: 'success',
      userId: sender.id,
      title: 'Запрос принят'
    });
    await notificationRepository.save(notification);

    res.json({ success: true, message: 'Request accepted' });
  } catch (error) {
    next(error);
  }
});

// Отклонить запрос на присоединение (для лидера) или отклонить приглашение (для получателя)
router.put('/requests/:id/decline', async (req: AuthRequest, res, next) => {
  try {
    const requestId = parseInt(req.params.id);
    const familyRequestRepository = AppDataSource.getRepository(FamilyRequest);
    const userRepository = AppDataSource.getRepository(User);

    const request = await familyRequestRepository.findOne({
      where: { 
        id: requestId,
        type: FamilyRequestType.JOIN_GROUP,
        status: FamilyRequestStatus.PENDING 
      },
      relations: ['familyGroup']
    });

    if (!request) {
      throw new ApiError('Request not found', 404);
    }

    // Проверяем: либо текущий пользователь - лидер группы, либо он - получатель приглашения
    const currentUser = await userRepository.findOne({ where: { id: req.userId } });
    if (!currentUser) {
      throw new ApiError('User not found', 404);
    }

    // Получатель приглашения (обычный пользователь, которому отправили приглашение)
    if (request.recipientId && request.recipientId === req.userId) {
      // Отклоняем приглашение
      request.status = FamilyRequestStatus.DECLINED;
      request.respondedAt = new Date();
      await familyRequestRepository.save(request);

      // Отправляем уведомление лидеру
      const notificationRepository = AppDataSource.getRepository(Notification);
      const notification = notificationRepository.create({
        message: `${currentUser.firstName} ${currentUser.lastName} отклонил(а) приглашение в группу`,
        type: 'info',
        userId: request.senderId,
        title: 'Приглашение отклонено'
      });
      await notificationRepository.save(notification);

      res.json({ success: true, message: 'Invitation declined' });
      return;
    }

    // Лидер группы отклоняет заявку на присоединение
    const currentFamilyUser = await userRepository.findOne({ where: { id: req.userId } });
    if (!currentFamilyUser || !currentFamilyUser.familyGroupId || currentFamilyUser.familyGroupId !== request.familyGroupId) {
      throw new ApiError('You are not authorized to decline this request', 403);
    }

    const familyGroupRepository = AppDataSource.getRepository(FamilyGroup);
    const group = await familyGroupRepository.findOne({ where: { id: request.familyGroupId } });
    
    if (!group || group.leaderId !== req.userId) {
      throw new ApiError('Only group leader can decline requests', 403);
    }

    // Обновляем статус запроса
    request.status = FamilyRequestStatus.DECLINED;
    request.respondedAt = new Date();
    await familyRequestRepository.save(request);

    // Отправляем уведомление
    const sender = await userRepository.findOne({ where: { id: request.senderId } });
    const notificationRepository = AppDataSource.getRepository(Notification);
    const notification = notificationRepository.create({
      message: `Ваш запрос на присоединение к группе "${group.name}" был отклонён`,
      type: 'info',
      userId: sender?.id,
      title: 'Запрос отклонён'
    });
    await notificationRepository.save(notification);

    res.json({ success: true, message: 'Request declined' });
  } catch (error) {
    next(error);
  }
});

// Удалить участника из группы (для лидера)
router.delete('/members/:memberId', async (req: AuthRequest, res, next) => {
  try {
    const memberId = parseInt(req.params.memberId);
    const userRepository = AppDataSource.getRepository(User);
    const familyGroupRepository = AppDataSource.getRepository(FamilyGroup);

    // Проверяем, является ли текущий пользователь лидером
    const currentUser = await userRepository.findOne({ where: { id: req.userId } });
    if (!currentUser || !currentUser.familyGroupId) {
      throw new ApiError('You are not in a family group', 400);
    }

    const group = await familyGroupRepository.findOne({ where: { id: currentUser.familyGroupId } });
    if (!group || group.leaderId !== req.userId) {
      throw new ApiError('Only group leader can remove members', 403);
    }

    // Нельзя удалить самого себя
    if (memberId === req.userId) {
      throw new ApiError('You cannot remove yourself. Use leave instead.', 400);
    }

    // Проверяем, что участник существует и состоит в группе
    const member = await userRepository.findOne({ where: { id: memberId, familyGroupId: group.id } });
    if (!member) {
      throw new ApiError('Member not found in this group', 404);
    }

    // Удаляем участника из группы
    member.familyGroupId = null;
    await userRepository.save(member);

    // Отправляем уведомление
    const notificationRepository = AppDataSource.getRepository(Notification);
    const notification = notificationRepository.create({
      message: `Вас удалили из семейной группы "${group.name}"`,
      type: 'info',
      userId: memberId,
      title: 'Удаление из группы'
    });
    await notificationRepository.save(notification);

    res.json({ success: true, message: 'Member removed successfully' });
  } catch (error) {
    next(error);
  }
});

// Передать статус лидера
router.put('/transfer-leadership/:newLeaderId', async (req: AuthRequest, res, next) => {
  try {
    const newLeaderId = parseInt(req.params.newLeaderId);
    const userRepository = AppDataSource.getRepository(User);
    const familyGroupRepository = AppDataSource.getRepository(FamilyGroup);

    // Проверяем, является ли текущий пользователь лидером
    const currentUser = await userRepository.findOne({ where: { id: req.userId } });
    if (!currentUser || !currentUser.familyGroupId) {
      throw new ApiError('You are not in a family group', 400);
    }

    const group = await familyGroupRepository.findOne({ where: { id: currentUser.familyGroupId } });
    if (!group || group.leaderId !== req.userId) {
      throw new ApiError('Only group leader can transfer leadership', 403);
    }

    // Проверяем, что новый лидер состоит в группе
    const newLeader = await userRepository.findOne({ where: { id: newLeaderId, familyGroupId: group.id } });
    if (!newLeader) {
      throw new ApiError('New leader must be a member of this group', 404);
    }

    // Передаем статус лидера
    group.leaderId = newLeaderId;
    await familyGroupRepository.save(group);

    // Отправляем уведомление новому лидеру
    const notificationRepository = AppDataSource.getRepository(Notification);
    const notification = notificationRepository.create({
      message: `Теперь вы являетесь лидером семейной группы "${group.name}"`,
      type: 'success',
      userId: newLeaderId,
      title: 'Новый лидер'
    });
    await notificationRepository.save(notification);

    // Отправляем уведомление старому лидеру
    const oldLeaderNotification = notificationRepository.create({
      message: `Вы передали статус лидера группы "${group.name}"`,
      type: 'info',
      userId: req.userId,
      title: 'Лидерство передано'
    });
    await notificationRepository.save(oldLeaderNotification);

    res.json({ success: true, message: 'Leadership transferred successfully' });
  } catch (error) {
    next(error);
  }
});

// Покинуть группу
router.post('/leave', async (req: AuthRequest, res, next) => {
  try {
    const userRepository = AppDataSource.getRepository(User);
    const familyGroupRepository = AppDataSource.getRepository(FamilyGroup);

    const user = await userRepository.findOne({ where: { id: req.userId } });
    if (!user || !user.familyGroupId) {
      throw new ApiError('You are not in a family group', 400);
    }

    const group = await familyGroupRepository.findOne({ where: { id: user.familyGroupId } });
    if (!group) {
      throw new ApiError('Family group not found', 404);
    }

    const isLeader = group.leaderId === req.userId;

    // Если пользователь лидер - удаляем всю группу
    if (isLeader) {
      // Находим всех участников группы
      const members = await userRepository.find({ where: { familyGroupId: group.id } });
      
      // Удаляем всех участников из группы
      for (const member of members) {
        member.familyGroupId = null;
        await userRepository.save(member);

        // Отправляем уведомление (кроме себя)
        if (member.id !== req.userId) {
          const notificationRepository = AppDataSource.getRepository(Notification);
          const notification = notificationRepository.create({
            message: `Семейная группа "${group.name}" была удалена лидером`,
            type: 'info',
            userId: member.id,
            title: 'Группа удалена'
          });
          await notificationRepository.save(notification);
        }
      }

      // Удаляем группу
      await familyGroupRepository.delete(group.id);

      res.json({ success: true, message: 'Group deleted successfully' });
    } else {
      // Обычный участник просто покидает группу
      user.familyGroupId = null;
      await userRepository.save(user);

      // Отправляем уведомление лидеру
      const notificationRepository = AppDataSource.getRepository(Notification);
      const notification = notificationRepository.create({
        message: `${user.firstName} ${user.lastName} покинул(а) семейную группу "${group.name}"`,
        type: 'info',
        userId: group.leaderId,
        title: 'Участник покинул группу'
      });
      await notificationRepository.save(notification);

      res.json({ success: true, message: 'Left group successfully' });
    }
  } catch (error) {
    next(error);
  }
});

// Отправить приглашение по email
router.post('/invite-by-email', async (req: AuthRequest, res, next) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      throw new ApiError('Email is required', 400);
    }

    const userRepository = AppDataSource.getRepository(User);
    const currentUser = await userRepository.findOne({ where: { id: req.userId } });

    if (!currentUser || !currentUser.familyGroupId) {
      throw new ApiError('You are not in a family group', 400);
    }

    const familyGroupRepository = AppDataSource.getRepository(FamilyGroup);
    const group = await familyGroupRepository.findOne({ where: { id: currentUser.familyGroupId } });

    if (!group || group.leaderId !== req.userId) {
      throw new ApiError('Only group leader can invite members', 403);
    }

    // Ищем пользователя по email
    const targetUser = await userRepository.findOne({ where: { email } });

    if (!targetUser) {
      throw new ApiError('User with this email not found', 404);
    }

    // Проверяем, не состоит ли пользователь уже в группе
    if (targetUser.familyGroupId) {
      throw new ApiError('User is already in a family group', 400);
    }

    // Создаем запрос на присоединение
    const familyRequestRepository = AppDataSource.getRepository(FamilyRequest);
    const newRequest = familyRequestRepository.create({
      senderId: req.userId,
      recipientId: targetUser.id,
      type: FamilyRequestType.JOIN_GROUP,
      familyGroupId: group.id,
      status: FamilyRequestStatus.PENDING
    });

    await familyRequestRepository.save(newRequest);

    // Отправляем уведомление пользователю
    const notificationRepository = AppDataSource.getRepository(Notification);
    const notification = notificationRepository.create({
      message: `${currentUser.firstName} ${currentUser.lastName} приглашает вас в семейную группу "${group.name}"`,
      type: 'family_request',
      userId: targetUser.id,
      title: 'Приглашение в семейную группу',
      relatedRequestId: newRequest.id
    });
    
    await notificationRepository.save(notification);

    res.json({ 
      success: true, 
      message: 'Invitation sent successfully',
      data: {
        invitedEmail: email,
        groupName: group.name
      }
    });
  } catch (error) {
    next(error);
  }
});

// Отменить свой запрос на присоединение
router.delete('/requests/:id/cancel', async (req: AuthRequest, res, next) => {
  try {
    const requestId = parseInt(req.params.id);
    const familyRequestRepository = AppDataSource.getRepository(FamilyRequest);

    const request = await familyRequestRepository.findOne({
      where: { 
        id: requestId, 
        senderId: req.userId, 
        type: FamilyRequestType.JOIN_GROUP,
        status: FamilyRequestStatus.PENDING 
      }
    });

    if (!request) {
      throw new ApiError('Request not found', 404);
    }

    await familyRequestRepository.delete(requestId);

    res.json({ success: true, message: 'Request cancelled' });
  } catch (error) {
    next(error);
  }
});

export default router;
