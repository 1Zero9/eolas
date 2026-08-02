-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "captureEnabled" BOOLEAN NOT NULL DEFAULT true,
    "capturePasscodeHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");

-- Preserve all prior content in a neutral workspace. It is deliberately not
-- exposed through a public capture portal until an administrator configures it.
INSERT INTO "Organization" ("id", "slug", "name", "captureEnabled", "createdAt", "updatedAt")
VALUES ('legacy-workspace', 'legacy-workspace', 'Legacy workspace', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

ALTER TABLE "Idea" ADD COLUMN "organizationId" TEXT;
ALTER TABLE "Project" ADD COLUMN "organizationId" TEXT;
ALTER TABLE "Job" ADD COLUMN "organizationId" TEXT;

UPDATE "Idea" SET "organizationId" = 'legacy-workspace' WHERE "organizationId" IS NULL;
UPDATE "Project" SET "organizationId" = 'legacy-workspace' WHERE "organizationId" IS NULL;
UPDATE "Job" SET "organizationId" = 'legacy-workspace' WHERE "organizationId" IS NULL;

ALTER TABLE "Idea" ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "Project" ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "Job" ALTER COLUMN "organizationId" SET NOT NULL;

CREATE INDEX "Idea_organizationId_status_idx" ON "Idea"("organizationId", "status");
CREATE INDEX "Project_organizationId_status_idx" ON "Project"("organizationId", "status");
CREATE INDEX "Job_organizationId_status_executionTarget_priority_idx" ON "Job"("organizationId", "status", "executionTarget", "priority");

ALTER TABLE "Idea" ADD CONSTRAINT "Idea_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Project" ADD CONSTRAINT "Project_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Job" ADD CONSTRAINT "Job_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
