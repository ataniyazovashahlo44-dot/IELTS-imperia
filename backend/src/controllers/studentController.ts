import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest, SubmitAnswer } from '../types';
import { joinTest, advanceSection, recordTabSwitch } from '../services/sessionService';
import { submitTest } from '../services/resultService';
import prisma from '../config/database';
import { getIO } from '../socket/socketHandler';

const joinSchema = z.object({ pin: z.string().length(4).regex(/^\d{4}$/) });

const submitSchema = z.object({
  answers: z.array(
    z.object({
      questionId: z.string(),
      questionType: z.enum(['VOCABULARY', 'GRAMMAR']),
      selectedAnswer: z.string(),
      questionText: z.string(),
    })
  ),
});

export async function handleJoinTest(req: AuthRequest, res: Response): Promise<void> {
  try {
    const parsed = joinSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, message: 'Invalid PIN format (must be 4 digits)' });
      return;
    }
    const data = await joinTest(req.user!.userId, parsed.data.pin);

    // Notify admin via socket
    const io = getIO();
    io.to(`admin_room`).emit('student_joined', {
      studentId: req.user!.userId,
      username: req.user!.username,
      testSessionId: data.testSessionId,
      pinCode: parsed.data.pin,
    });

    res.json({ success: true, data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to join test';
    res.status(400).json({ success: false, message });
  }
}

export async function handleAdvanceSection(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { testSessionId } = req.body;
    if (!testSessionId) {
      res.status(400).json({ success: false, message: 'testSessionId required' });
      return;
    }
    const nextSection = await advanceSection(req.user!.userId, testSessionId);
    res.json({ success: true, data: nextSection });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to advance section';
    res.status(400).json({ success: false, message });
  }
}

export async function handleSubmitTest(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { testSessionId } = req.params;
    const parsed = submitSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, message: 'Invalid answers format' });
      return;
    }

    const result = await submitTest(req.user!.userId, testSessionId, parsed.data.answers as SubmitAnswer[]);

    // Notify admin
    const io = getIO();
    io.to(`admin_room`).emit('student_submitted', {
      studentId: req.user!.userId,
      username: req.user!.username,
      testSessionId,
      totalScore: result.totalScore,
    });

    res.json({ success: true, data: result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to submit test';
    res.status(400).json({ success: false, message });
  }
}

export async function handleTabSwitch(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { testSessionId } = req.body;
    if (!testSessionId) {
      res.status(400).json({ success: false, message: 'testSessionId required' });
      return;
    }

    const count = await recordTabSwitch(req.user!.userId, testSessionId);

    const io = getIO();
    io.to(`admin_room`).emit('tab_switch_detected', {
      studentId: req.user!.userId,
      username: req.user!.username,
      testSessionId,
      tabSwitchCount: count,
      timestamp: new Date(),
    });

    res.json({ success: true, data: { tabSwitchCount: count } });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to record tab switch' });
  }
}

export async function handleGetActiveSession(req: AuthRequest, res: Response): Promise<void> {
  try {
    const session = await prisma.activeSession.findFirst({
      where: { studentId: req.user!.userId, isActive: true },
      include: { testSession: { include: { sections: { orderBy: { sectionOrder: 'asc' } } } } },
    });
    res.json({ success: true, data: session });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch session' });
  }
}

export async function handleGetStudentDashboard(req: AuthRequest, res: Response): Promise<void> {
  try {
    const studentId = req.user!.userId;
    const [totalTests, recentResults] = await Promise.all([
      prisma.result.count({ where: { studentId } }),
      prisma.result.findMany({
        where: { studentId },
        take: 5,
        orderBy: { submittedAt: 'desc' },
        include: { testSession: { select: { title: true, pinCode: true } } },
      }),
    ]);

    res.json({ success: true, data: { totalTests, recentResults } });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard' });
  }
}
