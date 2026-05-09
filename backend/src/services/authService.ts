import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/database';
import { ENV } from '../config/env';
import { JwtPayload } from '../types';

export async function registerStudent(data: {
  fullName: string;
  phoneNumber: string;
  username: string;
  password: string;
}) {
  const existing = await prisma.user.findFirst({
    where: { OR: [{ username: data.username }, { phoneNumber: data.phoneNumber }] },
  });

  if (existing?.username === data.username) {
    throw new Error('Username already taken');
  }
  if (existing?.phoneNumber === data.phoneNumber) {
    throw new Error('Phone number already registered');
  }

  const hashed = await bcrypt.hash(data.password, ENV.BCRYPT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      fullName: data.fullName,
      phoneNumber: data.phoneNumber,
      username: data.username,
      password: hashed,
      role: 'STUDENT',
    },
  });

  return sanitizeUser(user);
}

export async function loginUser(username: string, password: string) {
  const user = await prisma.user.findUnique({ where: { username } });

  if (!user) throw new Error('Invalid credentials');

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw new Error('Invalid credentials');

  const payload: JwtPayload = { userId: user.id, role: user.role as 'ADMIN' | 'STUDENT', username: user.username };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const token = jwt.sign(payload, ENV.JWT_SECRET, { expiresIn: ENV.JWT_EXPIRES_IN } as any);

  return { token, user: sanitizeUser(user) };
}

function sanitizeUser(user: { id: string; fullName: string; username: string; phoneNumber: string; role: string; createdAt: Date }) {
  return {
    id: user.id,
    fullName: user.fullName,
    username: user.username,
    phoneNumber: user.phoneNumber,
    role: user.role,
    createdAt: user.createdAt,
  };
}

export async function requestPasswordReset(username: string) {
  const user = await prisma.user.findUnique({ where: { username, role: 'STUDENT' } });
  if (!user) throw new Error('Student not found');

  const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  // Invalidate previous pending requests for this student
  await prisma.passwordResetRequest.updateMany({
    where: { studentId: user.id, isUsed: false },
    data: { isUsed: true }
  });

  await prisma.passwordResetRequest.create({
    data: {
      studentId: user.id,
      resetCode,
      expiresAt,
    }
  });

  return { success: true };
}

export async function resetPasswordWithCode(username: string, resetCode: string, newPassword: string) {
  const user = await prisma.user.findUnique({ where: { username, role: 'STUDENT' } });
  if (!user) throw new Error('Student not found');

  const request = await prisma.passwordResetRequest.findFirst({
    where: {
      studentId: user.id,
      resetCode,
      isUsed: false,
      expiresAt: { gt: new Date() }
    }
  });

  if (!request) throw new Error('Invalid or expired reset code');

  const hashed = await bcrypt.hash(newPassword, ENV.BCRYPT_ROUNDS);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { password: hashed }
    }),
    prisma.passwordResetRequest.update({
      where: { id: request.id },
      data: { isUsed: true }
    })
  ]);

  return { success: true };
}
