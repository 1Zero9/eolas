-- CreateEnum
CREATE TYPE "IdeaStatus" AS ENUM ('INBOX', 'ANALYSING', 'ASSESSED', 'READY', 'QUEUED', 'BUILDING', 'POC', 'MVP', 'PARKED', 'REJECTED');

-- CreateEnum
CREATE TYPE "IdeaSource" AS ENUM ('WEB', 'MOBILE', 'VOICE', 'IMPORT', 'API');

-- CreateTable
CREATE TABLE "Idea" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "rawCapture" TEXT NOT NULL,
    "summary" TEXT,
    "status" "IdeaStatus" NOT NULL DEFAULT 'INBOX',
    "source" "IdeaSource" NOT NULL DEFAULT 'WEB',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Idea_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Idea_status_idx" ON "Idea"("status");

-- CreateIndex
CREATE INDEX "Idea_createdAt_idx" ON "Idea"("createdAt");
