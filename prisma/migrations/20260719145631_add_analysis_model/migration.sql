-- CreateEnum
CREATE TYPE "AnalysisStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "IdeaAnalysis" (
    "id" TEXT NOT NULL,
    "ideaId" TEXT NOT NULL,
    "status" "AnalysisStatus" NOT NULL DEFAULT 'PENDING',
    "generatedTitle" TEXT,
    "generatedSummary" TEXT,
    "problemStatement" TEXT,
    "intendedUsers" JSONB,
    "categories" JSONB,
    "suggestedCapabilities" JSONB,
    "clarificationQuestions" JSONB,
    "recommendedNextAction" TEXT,
    "confidence" DOUBLE PRECISION,
    "rawResponse" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IdeaAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "IdeaAnalysis_ideaId_createdAt_idx" ON "IdeaAnalysis"("ideaId", "createdAt");

-- AddForeignKey
ALTER TABLE "IdeaAnalysis" ADD CONSTRAINT "IdeaAnalysis_ideaId_fkey" FOREIGN KEY ("ideaId") REFERENCES "Idea"("id") ON DELETE CASCADE ON UPDATE CASCADE;
