-- CreateEnum
CREATE TYPE "AssemblyPlanStatus" AS ENUM ('DRAFT', 'APPROVED', 'EXECUTING', 'COMPLETED', 'FAILED', 'SUPERSEDED');

-- CreateTable
CREATE TABLE "AssemblyPlan" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "status" "AssemblyPlanStatus" NOT NULL DEFAULT 'DRAFT',
    "planHash" TEXT NOT NULL,
    "accelerators" JSONB NOT NULL,
    "files" JSONB NOT NULL,
    "reuseMetrics" JSONB NOT NULL,
    "conflicts" JSONB NOT NULL,
    "approvedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "executionStartedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "result" JSONB,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssemblyPlan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AssemblyPlan_planHash_key" ON "AssemblyPlan"("planHash");
CREATE INDEX "AssemblyPlan_projectId_status_idx" ON "AssemblyPlan"("projectId", "status");
CREATE INDEX "AssemblyPlan_status_createdAt_idx" ON "AssemblyPlan"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "AssemblyPlan" ADD CONSTRAINT "AssemblyPlan_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
