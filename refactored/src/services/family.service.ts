import { Not } from 'typeorm';
import { AppDataSource } from '../config/database';
import { FamilyRequest, FamilyRequestStatus, FamilyRequestType } from '../entity/FamilyRequest';
import { FamilyGroup } from '../entity/FamilyGroup';
import { User } from '../entity/User';
import { Notification } from '../entity/Notification';
import { ApiError } from '../middleware/errorHandler';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const userRepo    = () => AppDataSource.getRepository(User);
const groupRepo   = () => AppDataSource.getRepository(FamilyGroup);
const requestRepo = () => AppDataSource.getRepository(FamilyRequest);
const notifRepo   = () => AppDataSource.getRepository(Notification);

async function getUser(userId: number): Promise<User> {
  const user = await userRepo().findOne({ where: { id: userId } });
  if (!user) throw new ApiError('User not found', 404);
  return user;
}

async function notify(
  userId: number,
  title: string,
  message: string,
  type: string,
  relatedRequestId?: number,
): Promise<void> {
  await notifRepo().save(
    notifRepo().create({ userId, title, message, type, relatedRequestId }),
  );
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function createGroup(userId: number, name: string) {
  const user = await getUser(userId);
  if (user.familyGroupId) throw new ApiError('You are already in a family group', 400);

  const inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase();
  const group = await groupRepo().save(groupRepo().create({ name, leaderId: userId, inviteCode }));

  user.familyGroupId = group.id;
  await userRepo().save(user);

  return {
    id: group.id,
    name: group.name,
    leaderId: group.leaderId,
    inviteCode: group.inviteCode,
    isLeader: true,
    isInGroup: true,
    members: [{
      id: user.id,
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      avatar: user.firstName.charAt(0).toUpperCase(),
      isLeader: true,
    }],
  };
}

export async function joinGroup(userId: number, inviteCode: string) {
  const user = await getUser(userId);
  if (user.familyGroupId) throw new ApiError('You are already in a family group', 400);

  const group = await groupRepo().findOne({ where: { inviteCode: inviteCode.toUpperCase() } });
  if (!group) throw new ApiError('Invalid invite code', 404);

  const existing = await requestRepo().findOne({
    where: { senderId: userId, familyGroupId: group.id, status: FamilyRequestStatus.PENDING },
  });
  if (existing) throw new ApiError('You already have a pending request to join this group', 400);

  const newRequest = await requestRepo().save(
    requestRepo().create({ senderId: userId, type: FamilyRequestType.JOIN_GROUP, familyGroupId: group.id, status: FamilyRequestStatus.PENDING }),
  );

  await notify(
    group.leaderId,
    'Запрос на присоединение',
    `${user.firstName} ${user.lastName} хочет присоединиться к вашей семейной группе "${group.name}"`,
    'family_request',
    newRequest.id,
  );

  return { requestId: newRequest.id, groupName: group.name };
}

export async function getGroupStatus(userId: number) {
  const user = await userRepo().findOne({ where: { id: userId }, relations: ['familyGroup'] });
  if (!user) throw new ApiError('User not found', 404);

  if (!user.familyGroupId || !user.familyGroup) {
    return { isInGroup: false, isLeader: false, groupName: null, groupId: null, inviteCode: null, members: [] };
  }

  const group = await groupRepo().findOne({ where: { id: user.familyGroupId }, relations: ['members'] });
  if (!group) {
    return { isInGroup: false, isLeader: false, groupName: null, groupId: null, inviteCode: null, members: [] };
  }

  return {
    isInGroup: true,
    isLeader: group.leaderId === userId,
    groupName: group.name,
    groupId: group.id,
    inviteCode: group.inviteCode,
    members: group.members.map((m) => ({
      id: m.id,
      name: `${m.firstName} ${m.lastName}`,
      email: m.email,
      avatar: m.firstName.charAt(0).toUpperCase(),
      isLeader: m.id === group.leaderId,
    })),
  };
}

export async function getIncomingRequests(userId: number) {
  const user = await getUser(userId);
  if (!user.familyGroupId) throw new ApiError('You are not in a family group', 400);

  const group = await groupRepo().findOne({ where: { id: user.familyGroupId } });
  if (!group || group.leaderId !== userId) throw new ApiError('Only group leader can view incoming requests', 403);

  const requests = await requestRepo().find({
    where: {
      familyGroupId: group.id,
      type: FamilyRequestType.JOIN_GROUP,
      status: FamilyRequestStatus.PENDING,
      senderId: Not(userId),
    },
    relations: ['sender'],
    order: { createdAt: 'DESC' },
  });

  return requests.map((r) => ({
    id: r.id,
    senderId: r.senderId,
    senderName: r.sender ? `${r.sender.firstName} ${r.sender.lastName}` : 'Unknown',
    senderEmail: r.sender?.email,
    status: r.status,
    createdAt: r.createdAt,
  }));
}

export async function acceptRequest(requestId: number, userId: number) {
  const request = await requestRepo().findOne({
    where: { id: requestId, type: FamilyRequestType.JOIN_GROUP, status: FamilyRequestStatus.PENDING },
    relations: ['sender', 'familyGroup'],
  });
  if (!request) throw new ApiError('Request not found', 404);

  const currentUser = await getUser(userId);

  // Recipient accepts an invitation sent to them
  if (request.recipientId && request.recipientId === userId) {
    request.status = FamilyRequestStatus.ACCEPTED;
    request.respondedAt = new Date();
    await requestRepo().save(request);

    currentUser.familyGroupId = request.familyGroupId;
    await userRepo().save(currentUser);

    await notify(request.senderId, 'Приглашение принято', `${currentUser.firstName} ${currentUser.lastName} принял(а) ваше приглашение в группу`, 'success');
    return;
  }

  // Group leader accepts a join request
  if (!currentUser.familyGroupId || currentUser.familyGroupId !== request.familyGroupId) {
    throw new ApiError('You are not authorized to accept this request', 403);
  }
  if (request.familyGroup.leaderId !== userId) throw new ApiError('Only group leader can accept requests', 403);

  request.status = FamilyRequestStatus.ACCEPTED;
  request.respondedAt = new Date();
  await requestRepo().save(request);

  request.sender.familyGroupId = request.familyGroup.id;
  await userRepo().save(request.sender);

  await notify(request.sender.id, 'Запрос принят', `Ваш запрос на присоединение к группе "${request.familyGroup.name}" был принят`, 'success');
}

export async function declineRequest(requestId: number, userId: number) {
  const request = await requestRepo().findOne({
    where: { id: requestId, type: FamilyRequestType.JOIN_GROUP, status: FamilyRequestStatus.PENDING },
    relations: ['familyGroup'],
  });
  if (!request) throw new ApiError('Request not found', 404);

  const currentUser = await getUser(userId);

  // Recipient declines an invitation
  if (request.recipientId && request.recipientId === userId) {
    request.status = FamilyRequestStatus.DECLINED;
    request.respondedAt = new Date();
    await requestRepo().save(request);
    await notify(request.senderId, 'Приглашение отклонено', `${currentUser.firstName} ${currentUser.lastName} отклонил(а) приглашение в группу`, 'info');
    return;
  }

  // Group leader declines a join request
  if (!currentUser.familyGroupId || currentUser.familyGroupId !== request.familyGroupId) {
    throw new ApiError('You are not authorized to decline this request', 403);
  }

  const group = await groupRepo().findOne({ where: { id: request.familyGroupId } });
  if (!group || group.leaderId !== userId) throw new ApiError('Only group leader can decline requests', 403);

  request.status = FamilyRequestStatus.DECLINED;
  request.respondedAt = new Date();
  await requestRepo().save(request);

  const sender = await userRepo().findOne({ where: { id: request.senderId } });
  if (sender) {
    await notify(sender.id, 'Запрос отклонён', `Ваш запрос на присоединение к группе "${group.name}" был отклонён`, 'info');
  }
}

export async function removeMember(leaderId: number, memberId: number) {
  const leader = await getUser(leaderId);
  if (!leader.familyGroupId) throw new ApiError('You are not in a family group', 400);

  const group = await groupRepo().findOne({ where: { id: leader.familyGroupId } });
  if (!group || group.leaderId !== leaderId) throw new ApiError('Only group leader can remove members', 403);

  if (memberId === leaderId) throw new ApiError('You cannot remove yourself. Use leave instead.', 400);

  const member = await userRepo().findOne({ where: { id: memberId, familyGroupId: group.id } });
  if (!member) throw new ApiError('Member not found in this group', 404);

  member.familyGroupId = null;
  await userRepo().save(member);

  await notify(memberId, 'Удаление из группы', `Вас удалили из семейной группы "${group.name}"`, 'info');
}

export async function transferLeadership(currentLeaderId: number, newLeaderId: number) {
  const currentLeader = await getUser(currentLeaderId);
  if (!currentLeader.familyGroupId) throw new ApiError('You are not in a family group', 400);

  const group = await groupRepo().findOne({ where: { id: currentLeader.familyGroupId } });
  if (!group || group.leaderId !== currentLeaderId) throw new ApiError('Only group leader can transfer leadership', 403);

  const newLeader = await userRepo().findOne({ where: { id: newLeaderId, familyGroupId: group.id } });
  if (!newLeader) throw new ApiError('New leader must be a member of this group', 404);

  group.leaderId = newLeaderId;
  await groupRepo().save(group);

  await notify(newLeaderId, 'Новый лидер', `Теперь вы являетесь лидером семейной группы "${group.name}"`, 'success');
  await notify(currentLeaderId, 'Лидерство передано', `Вы передали статус лидера группы "${group.name}"`, 'info');
}

export async function leaveGroup(userId: number) {
  const user = await getUser(userId);
  if (!user.familyGroupId) throw new ApiError('You are not in a family group', 400);

  const group = await groupRepo().findOne({ where: { id: user.familyGroupId } });
  if (!group) throw new ApiError('Family group not found', 404);

  if (group.leaderId === userId) {
    // Leader leaves — dissolve the whole group
    const members = await userRepo().find({ where: { familyGroupId: group.id } });
    for (const member of members) {
      member.familyGroupId = null;
      await userRepo().save(member);
      if (member.id !== userId) {
        await notify(member.id, 'Группа удалена', `Семейная группа "${group.name}" была удалена лидером`, 'info');
      }
    }
    await groupRepo().delete(group.id);
    return 'Group deleted successfully';
  }

  user.familyGroupId = null;
  await userRepo().save(user);
  await notify(group.leaderId, 'Участник покинул группу', `${user.firstName} ${user.lastName} покинул(а) семейную группу "${group.name}"`, 'info');
  return 'Left group successfully';
}

export async function inviteByEmail(leaderId: number, email: string) {
  const leader = await getUser(leaderId);
  if (!leader.familyGroupId) throw new ApiError('You are not in a family group', 400);

  const group = await groupRepo().findOne({ where: { id: leader.familyGroupId } });
  if (!group || group.leaderId !== leaderId) throw new ApiError('Only group leader can invite members', 403);

  const target = await userRepo().findOne({ where: { email } });
  if (!target) throw new ApiError('User with this email not found', 404);
  if (target.familyGroupId) throw new ApiError('User is already in a family group', 400);

  const newRequest = await requestRepo().save(
    requestRepo().create({
      senderId: leaderId,
      recipientId: target.id,
      type: FamilyRequestType.JOIN_GROUP,
      familyGroupId: group.id,
      status: FamilyRequestStatus.PENDING,
    }),
  );

  await notify(
    target.id,
    'Приглашение в семейную группу',
    `${leader.firstName} ${leader.lastName} приглашает вас в семейную группу "${group.name}"`,
    'family_request',
    newRequest.id,
  );

  return { invitedEmail: email, groupName: group.name };
}

export async function cancelRequest(requestId: number, userId: number) {
  const request = await requestRepo().findOne({
    where: { id: requestId, senderId: userId, type: FamilyRequestType.JOIN_GROUP, status: FamilyRequestStatus.PENDING },
  });
  if (!request) throw new ApiError('Request not found', 404);
  await requestRepo().delete(requestId);
}
