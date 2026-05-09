import { Request, Response } from 'express';
import { z } from 'zod';
import { registerStudent, loginUser, requestPasswordReset, resetPasswordWithCode } from '../services/authService';
import { AuthRequest } from '../types';
import prisma from '../config/database';

const registerSchema = z.object({
  fullName: z.string().min(2).max(100),
  phoneNumber: z.string().min(7).max(20),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/, 'Only letters, numbers, underscores'),
  password: z.string().min(6).max(100),
});

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, message: parsed.error.errors[0].message });
      return;
    }
    const user = await registerStudent(parsed.data);
    res.status(201).json({ success: true, message: 'Registration successful', data: user });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Registration failed';
    res.status(400).json({ success: false, message });
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, message: 'Username and password are required' });
      return;
    }
    const result = await loginUser(parsed.data.username, parsed.data.password);
    res.json({ success: true, data: result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Login failed';
    res.status(401).json({ success: false, message });
  }
}

export async function getMe(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { id: true, fullName: true, username: true, phoneNumber: true, role: true, createdAt: true },
    });
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }
    res.json({ success: true, data: user });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch user' });
  }
}

const requestResetSchema = z.object({
  username: z.string().min(1),
});

const resetPasswordSchema = z.object({
  username: z.string().min(1),
  resetCode: z.string().length(6),
  newPassword: z.string().min(6).max(100),
});

export async function handleRequestReset(req: Request, res: Response): Promise<void> {
  try {
    const parsed = requestResetSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, message: 'Username required' });
      return;
    }
    await requestPasswordReset(parsed.data.username);
    res.json({ success: true, message: 'Reset request created' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Request failed';
    res.status(400).json({ success: false, message });
  }
}

export async function handleResetPassword(req: Request, res: Response): Promise<void> {
  try {
    const parsed = resetPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, message: 'Invalid payload' });
      return;
    }
    await resetPasswordWithCode(parsed.data.username, parsed.data.resetCode, parsed.data.newPassword);
    res.json({ success: true, message: 'Password reset successfully' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Reset failed';
    res.status(400).json({ success: false, message });
  }
}
