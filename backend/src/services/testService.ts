import prisma from '../config/database';
import { generateUniquePIN } from '../utils/pinGenerator';
import { SectionConfig } from '../types';

// ─── ADMIN: Create Test ───────────────────────────────────────────────────────

export async function createTest(
  adminId: string,
  title: string,
  maxAttempts: number,
  sections: SectionConfig[]
) {
  const pinCode = await generateUniquePIN();

  const testSession = await prisma.testSession.create({
    data: {
      pinCode,
      title,
      maxAttempts,
      createdBy: adminId,
      sections: {
        create: sections.map(s => ({
          subject: s.subject,
          sectionType: s.sectionType || 'EXERCISE',
          selectionMode: s.selectionMode || 'BY_EXERCISE',
          targetQuestionCount: s.targetQuestionCount,
          variantGroups: JSON.stringify(s.variantGroups),
          numberOfExercises: s.numberOfExercises,
          timeAllocated: s.timeAllocated,
          sectionOrder: s.sectionOrder,
        })),
      },
    },
    include: { sections: { orderBy: { sectionOrder: 'asc' } } },
  });

  return testSession;
}

// ─── ADMIN: Get all tests ─────────────────────────────────────────────────────

export async function getAdminTests(adminId: string) {
  return prisma.testSession.findMany({
    where: { createdBy: adminId },
    include: {
      sections: { orderBy: { sectionOrder: 'asc' } },
      _count: { select: { results: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

// ─── ADMIN: Toggle test active status ────────────────────────────────────────

export async function toggleTestStatus(testId: string, adminId: string) {
  const test = await prisma.testSession.findFirst({ where: { id: testId, createdBy: adminId } });
  if (!test) throw new Error('Test not found');

  return prisma.testSession.update({
    where: { id: testId },
    data: { isActive: !test.isActive },
  });
}

// ─── STUDENT: Validate PIN ──────────────────────────────────────────────────

export async function validatePinAndGetSections(pin: string) {
  const session = await prisma.testSession.findUnique({
    where: { pinCode: pin },
    include: { sections: { orderBy: { sectionOrder: 'asc' } } },
  });

  if (!session) throw new Error('Invalid PIN code');
  if (!session.isActive) throw new Error('This test is no longer active');

  return session;
}
