-- CreateTable
CREATE TABLE "Accelerator" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "capabilities" JSONB NOT NULL,
    "files" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'APPROVED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Accelerator_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Accelerator_slug_key" ON "Accelerator"("slug");

-- CreateIndex
CREATE INDEX "Accelerator_status_idx" ON "Accelerator"("status");

-- CreateIndex
CREATE INDEX "Accelerator_category_idx" ON "Accelerator"("category");
