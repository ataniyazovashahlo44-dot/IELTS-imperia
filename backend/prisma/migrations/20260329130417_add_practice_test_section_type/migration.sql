-- CreateEnum
CREATE TYPE "SectionType" AS ENUM ('EXERCISE', 'PRACTICE_TEST');

-- AlterTable
ALTER TABLE "TestSection" ADD COLUMN     "sectionType" "SectionType" NOT NULL DEFAULT 'EXERCISE';
