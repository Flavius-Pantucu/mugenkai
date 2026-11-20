-- CreateEnum
CREATE TYPE "ListStatus" AS ENUM ('CURRENT', 'PLANNING', 'COMPLETED', 'PAUSED', 'DROPPED');

-- AlterTable
ALTER TABLE "ListEntry" ADD COLUMN     "status" "ListStatus" NOT NULL DEFAULT 'PLANNING',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "ListEntry_userId_updatedAt_idx" ON "ListEntry"("userId", "updatedAt" DESC);

