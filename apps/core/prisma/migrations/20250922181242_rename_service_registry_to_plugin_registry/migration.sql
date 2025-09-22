/*
  Warnings:

  - You are about to drop the `service_registry` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "PluginStatusEnum" AS ENUM ('ACTIVE', 'INACTIVE', 'MAINTENANCE', 'ERROR', 'DEGRADED');

-- DropTable
DROP TABLE "service_registry";

-- DropEnum
DROP TYPE "AttendanceStatus";

-- DropEnum
DROP TYPE "ContactMethod";

-- DropEnum
DROP TYPE "EmploymentType";

-- DropEnum
DROP TYPE "EnrollmentStatus";

-- DropEnum
DROP TYPE "ExamType";

-- DropEnum
DROP TYPE "ServiceStatusEnum";

-- DropEnum
DROP TYPE "StudentClassStatus";

-- DropEnum
DROP TYPE "TeacherStudentType";

-- CreateTable
CREATE TABLE "plugin_registry" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT,
    "description" TEXT,
    "url" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT '1.0.0',
    "status" "PluginStatusEnum" NOT NULL DEFAULT 'INACTIVE',
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

    CONSTRAINT "plugin_registry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "plugin_registry_name_key" ON "plugin_registry"("name");

-- CreateIndex
CREATE INDEX "plugin_registry_name_idx" ON "plugin_registry"("name");

-- CreateIndex
CREATE INDEX "plugin_registry_status_idx" ON "plugin_registry"("status");

-- CreateIndex
CREATE INDEX "plugin_registry_isRequired_idx" ON "plugin_registry"("isRequired");
