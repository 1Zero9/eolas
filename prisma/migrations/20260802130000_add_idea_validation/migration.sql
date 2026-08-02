-- CreateEnum
CREATE TYPE "ValidationDecision" AS ENUM ('VALIDATE', 'BUILD', 'PARK', 'REJECT');

-- CreateTable
CREATE TABLE "IdeaValidation" (
    "id" TEXT NOT NULL,
    "ideaId" TEXT NOT NULL,
    "decision" "ValidationDecision" NOT NULL,
    "problemClarity" INTEGER NOT NULL,
    "evidenceStrength" INTEGER NOT NULL,
    "effortEstimate" INTEGER NOT NULL,
    "riskiestAssumption" TEXT NOT NULL,
    "smallestTest" TEXT NOT NULL,
    "decisionRationale" TEXT NOT NULL,
    "evidenceLinks" JSONB NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IdeaValidation_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "IdeaValidation_ideaId_createdAt_idx" ON "IdeaValidation"("ideaId", "createdAt");
CREATE INDEX "IdeaValidation_decision_createdAt_idx" ON "IdeaValidation"("decision", "createdAt");
ALTER TABLE "IdeaValidation" ADD CONSTRAINT "IdeaValidation_ideaId_fkey" FOREIGN KEY ("ideaId") REFERENCES "Idea"("id") ON DELETE CASCADE ON UPDATE CASCADE;
