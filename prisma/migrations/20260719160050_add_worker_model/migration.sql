-- CreateEnum
CREATE TYPE "WorkerStatus" AS ENUM ('ONLINE', 'OFFLINE', 'BUSY', 'DISABLED');

-- CreateTable
CREATE TABLE "Worker" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "hostname" TEXT,
    "status" "WorkerStatus" NOT NULL DEFAULT 'OFFLINE',
    "allowedProjectRoot" TEXT NOT NULL,
    "capabilities" JSONB NOT NULL,
    "version" TEXT,
    "lastSeenAt" TIMESTAMP(3),
    "currentJobId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Worker_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Worker_name_key" ON "Worker"("name");

-- CreateIndex
CREATE INDEX "Worker_status_lastSeenAt_idx" ON "Worker"("status", "lastSeenAt");

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE SET NULL ON UPDATE CASCADE;
