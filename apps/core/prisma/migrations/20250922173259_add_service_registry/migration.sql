-- CreateEnum
CREATE TYPE "ServiceStatusEnum" AS ENUM ('ACTIVE', 'INACTIVE', 'MAINTENANCE', 'ERROR', 'DEGRADED');

-- CreateTable
CREATE TABLE "service_registry" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT,
    "description" TEXT,
    "url" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT '1.0.0',
    "status" "ServiceStatusEnum" NOT NULL DEFAULT 'INACTIVE',
    "healthCheck" TEXT,
    "metadata" JSONB,
    "dependencies" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastHealthCheck" TIMESTAMP(3),
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "service_registry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "service_registry_name_key" ON "service_registry"("name");

-- CreateIndex
CREATE INDEX "service_registry_name_idx" ON "service_registry"("name");

-- CreateIndex
CREATE INDEX "service_registry_status_idx" ON "service_registry"("status");

-- CreateIndex
CREATE INDEX "service_registry_isRequired_idx" ON "service_registry"("isRequired");
