import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { AppDataSource } from '../config/database';
import { User } from '../entity/User';
import { Session } from '../entity/Session';
import { ApiError } from '../middleware/errorHandler';
import { RegisterDto, LoginDto, ChangePasswordDto, UpdateProfileDto } from '../validators/auth.validator';

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

function requireSecret(value: string | undefined, name: string): string {
  if (!value) throw new Error(`${name} environment variable is not set`);
  return value;
}

function generateAccessToken(userId: number, sessionId: string): string {
  return jwt.sign(
    { userId, sessionId, type: 'access' },
    requireSecret(ACCESS_TOKEN_SECRET, 'ACCESS_TOKEN_SECRET'),
    { expiresIn: ACCESS_TOKEN_EXPIRY },
  );
}

function generateRefreshToken(userId: number, sessionId: string): string {
  return jwt.sign(
    { userId, sessionId, type: 'refresh' },
    requireSecret(REFRESH_TOKEN_SECRET, 'REFRESH_TOKEN_SECRET'),
    { expiresIn: REFRESH_TOKEN_EXPIRY },
  );
}

async function createSession(userId: number, deviceInfo: string, ipAddress: string): Promise<Session> {
  const sessionRepo = AppDataSource.getRepository(Session);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  // Save first to get the generated UUID id
  const session = sessionRepo.create({ userId, refreshToken: '', deviceInfo, ipAddress, expiresAt, isActive: true });
  await sessionRepo.save(session);

  // Now update refresh token with the real session id
  session.refreshToken = generateRefreshToken(userId, session.id);
  await sessionRepo.save(session);

  return session;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function register(dto: RegisterDto, deviceInfo: string, ipAddress: string) {
  const userRepo = AppDataSource.getRepository(User);

  const existing = await userRepo.findOne({ where: { email: dto.email } });
  if (existing) throw new ApiError('Email already in use', 400);

  const hashedPassword = await bcrypt.hash(dto.password, 10);
  const user = userRepo.create({ ...dto, password: hashedPassword, isActive: true });
  await userRepo.save(user);

  const session = await createSession(user.id, deviceInfo, ipAddress);
  const accessToken = generateAccessToken(user.id, session.id);
  const refreshToken = generateRefreshToken(user.id, session.id);

  return {
    user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName },
    accessToken,
    refreshToken,
  };
}

export async function login(dto: LoginDto, deviceInfo: string, ipAddress: string) {
  const userRepo = AppDataSource.getRepository(User);

  const user = await userRepo.findOne({ where: { email: dto.email } });
  if (!user) throw new ApiError('Invalid credentials', 401);

  const isValid = await bcrypt.compare(dto.password, user.password);
  if (!isValid) throw new ApiError('Invalid credentials', 401);

  const session = await createSession(user.id, deviceInfo, ipAddress);
  const accessToken = generateAccessToken(user.id, session.id);
  const refreshToken = generateRefreshToken(user.id, session.id);

  return {
    user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName },
    accessToken,
    refreshToken,
  };
}

export async function refreshTokens(refreshToken: string) {
  const secret = requireSecret(REFRESH_TOKEN_SECRET, 'REFRESH_TOKEN_SECRET');

  let decoded: { userId: number; sessionId: string; type: string };
  try {
    decoded = jwt.verify(refreshToken, secret) as typeof decoded;
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) throw new ApiError('Refresh token expired', 401);
    throw new ApiError('Invalid refresh token', 401);
  }

  if (decoded.type !== 'refresh') throw new ApiError('Invalid token type', 401);

  const sessionRepo = AppDataSource.getRepository(Session);
  const session = await sessionRepo.findOne({ where: { id: decoded.sessionId, isActive: true } });

  if (!session || new Date() > session.expiresAt) {
    if (session) { session.isActive = false; await sessionRepo.save(session); }
    throw new ApiError('Session expired or invalid', 401);
  }

  const userRepo = AppDataSource.getRepository(User);
  const user = await userRepo.findOne({ where: { id: decoded.userId } });
  if (!user) throw new ApiError('User not found', 404);

  const newAccessToken = generateAccessToken(user.id, decoded.sessionId);
  return { accessToken: newAccessToken, refreshToken };
}

export async function logout(userId: number): Promise<void> {
  const sessionRepo = AppDataSource.getRepository(Session);
  await sessionRepo.update({ userId, isActive: true }, { isActive: false });
}

export async function logoutSession(userId: number, sessionId: string): Promise<void> {
  const sessionRepo = AppDataSource.getRepository(Session);
  const session = await sessionRepo.findOne({ where: { id: sessionId, userId } });
  if (!session) throw new ApiError('Session not found', 404);
  session.isActive = false;
  await sessionRepo.save(session);
}

export async function listSessions(userId: number) {
  return AppDataSource.getRepository(Session).find({
    where: { userId },
    order: { createdAt: 'DESC' },
    select: ['id', 'deviceInfo', 'ipAddress', 'expiresAt', 'isActive', 'createdAt'],
  });
}

export async function revokeAllSessions(userId: number): Promise<void> {
  await AppDataSource.getRepository(Session).update({ userId, isActive: true }, { isActive: false });
}

export async function verifyPassword(userId: number, password: string): Promise<boolean> {
  const user = await AppDataSource.getRepository(User).findOne({ where: { id: userId } });
  if (!user) throw new ApiError('User not found', 404);
  return bcrypt.compare(password, user.password);
}

export async function changePassword(userId: number, dto: ChangePasswordDto): Promise<void> {
  const userRepo = AppDataSource.getRepository(User);
  const user = await userRepo.findOne({ where: { id: userId } });
  if (!user) throw new ApiError('User not found', 404);

  const isValid = await bcrypt.compare(dto.currentPassword, user.password);
  if (!isValid) throw new ApiError('Current password is incorrect', 400);

  user.password = await bcrypt.hash(dto.newPassword, 10);
  await userRepo.save(user);
}

export async function updateProfile(userId: number, dto: UpdateProfileDto) {
  const userRepo = AppDataSource.getRepository(User);
  const user = await userRepo.findOne({ where: { id: userId } });
  if (!user) throw new ApiError('User not found', 404);

  if (dto.email && dto.email !== user.email) {
    const existing = await userRepo.findOne({ where: { email: dto.email } });
    if (existing) throw new ApiError('Email already in use', 400);
    user.email = dto.email;
  }

  if (dto.firstName) user.firstName = dto.firstName;
  if (dto.lastName) user.lastName = dto.lastName;

  await userRepo.save(user);
  return { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName };
}
