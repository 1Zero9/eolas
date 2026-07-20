-- CreateTable
CREATE TABLE "IdeaNote" (
    "id" TEXT NOT NULL,
    "ideaId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IdeaNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "IdeaNote_ideaId_createdAt_idx" ON "IdeaNote"("ideaId", "createdAt");

-- AddForeignKey
ALTER TABLE "IdeaNote" ADD CONSTRAINT "IdeaNote_ideaId_fkey" FOREIGN KEY ("ideaId") REFERENCES "Idea"("id") ON DELETE CASCADE ON UPDATE CASCADE;
