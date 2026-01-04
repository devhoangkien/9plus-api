-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('OPENAPI', 'MARKDOWN', 'POSTMAN', 'HAR', 'FIGMA', 'TEXT');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "TestType" AS ENUM ('WEB', 'API');

-- CreateEnum
CREATE TYPE "TestRunStatus" AS ENUM ('PENDING', 'RUNNING', 'PASSED', 'FAILED', 'PARTIAL', 'ERROR', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TestResultStatus" AS ENUM ('PENDING', 'RUNNING', 'PASSED', 'FAILED', 'SKIPPED', 'ERROR');

-- CreateEnum
CREATE TYPE "TestRunTriggerSource" AS ENUM ('MANUAL', 'CI_CD', 'SCHEDULE', 'API');

-- CreateEnum
CREATE TYPE "ModelProvider" AS ENUM ('ANTHROPIC', 'GOOGLE', 'OPENAI', 'AZURE_OPENAI', 'CUSTOM');

-- CreateEnum
CREATE TYPE "TestCategory" AS ENUM ('FUNCTIONAL', 'SECURITY', 'PERFORMANCE', 'ACCESSIBILITY', 'VISUAL');

-- CreateEnum
CREATE TYPE "SecurityTestType" AS ENUM ('XSS_INJECTION', 'SQL_INJECTION', 'AUTH_BYPASS', 'CSRF', 'INSECURE_DIRECT_OBJECT', 'SENSITIVE_DATA_EXPOSURE', 'BROKEN_ACCESS_CONTROL', 'COMMAND_INJECTION', 'PATH_TRAVERSAL');

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "defaultModelId" TEXT,
    "settings" JSONB,
    "baseUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_cases" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "TestType" NOT NULL,
    "category" "TestCategory" NOT NULL DEFAULT 'FUNCTIONAL',
    "securityType" "SecurityTestType",
    "priority" INTEGER NOT NULL DEFAULT 0,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "steps" JSONB,
    "script" TEXT,
    "generatedBy" TEXT,
    "originalPrompt" TEXT,
    "sourceDocId" TEXT,
    "targetUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "test_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_runs" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT,
    "description" TEXT,
    "status" "TestRunStatus" NOT NULL DEFAULT 'PENDING',
    "triggerSource" "TestRunTriggerSource" NOT NULL DEFAULT 'MANUAL',
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "environment" TEXT,
    "config" JSONB,
    "totalTests" INTEGER NOT NULL DEFAULT 0,
    "passedTests" INTEGER NOT NULL DEFAULT 0,
    "failedTests" INTEGER NOT NULL DEFAULT 0,
    "skippedTests" INTEGER NOT NULL DEFAULT 0,
    "buildId" TEXT,
    "commitSha" TEXT,
    "branch" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "test_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_run_results" (
    "id" TEXT NOT NULL,
    "testRunId" TEXT NOT NULL,
    "testCaseId" TEXT NOT NULL,
    "status" "TestResultStatus" NOT NULL DEFAULT 'PENDING',
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "duration" INTEGER,
    "logs" TEXT,
    "errorMessage" TEXT,
    "errorStack" TEXT,
    "screenshotUrl" TEXT,
    "artifacts" JSONB,
    "stepResults" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "test_run_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "model_configs" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "provider" "ModelProvider" NOT NULL,
    "modelName" TEXT NOT NULL,
    "apiBaseUrl" TEXT NOT NULL,
    "apiKeyRef" TEXT NOT NULL,
    "parameters" JSONB,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "projectId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "model_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_documents" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "DocumentType" NOT NULL,
    "description" TEXT,
    "url" TEXT,
    "content" TEXT,
    "metadata" JSONB,
    "status" "DocumentStatus" NOT NULL DEFAULT 'PENDING',
    "processedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "test_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "projects_name_idx" ON "projects"("name");

-- CreateIndex
CREATE INDEX "test_cases_projectId_idx" ON "test_cases"("projectId");

-- CreateIndex
CREATE INDEX "test_cases_type_idx" ON "test_cases"("type");

-- CreateIndex
CREATE INDEX "test_cases_category_idx" ON "test_cases"("category");

-- CreateIndex
CREATE INDEX "test_cases_isActive_idx" ON "test_cases"("isActive");

-- CreateIndex
CREATE INDEX "test_runs_projectId_idx" ON "test_runs"("projectId");

-- CreateIndex
CREATE INDEX "test_runs_status_idx" ON "test_runs"("status");

-- CreateIndex
CREATE INDEX "test_runs_triggerSource_idx" ON "test_runs"("triggerSource");

-- CreateIndex
CREATE INDEX "test_runs_startedAt_idx" ON "test_runs"("startedAt");

-- CreateIndex
CREATE INDEX "test_run_results_testRunId_idx" ON "test_run_results"("testRunId");

-- CreateIndex
CREATE INDEX "test_run_results_testCaseId_idx" ON "test_run_results"("testCaseId");

-- CreateIndex
CREATE INDEX "test_run_results_status_idx" ON "test_run_results"("status");

-- CreateIndex
CREATE INDEX "model_configs_provider_idx" ON "model_configs"("provider");

-- CreateIndex
CREATE INDEX "model_configs_isDefault_idx" ON "model_configs"("isDefault");

-- CreateIndex
CREATE INDEX "model_configs_projectId_idx" ON "model_configs"("projectId");

-- CreateIndex
CREATE INDEX "model_configs_isActive_idx" ON "model_configs"("isActive");

-- CreateIndex
CREATE INDEX "test_documents_projectId_idx" ON "test_documents"("projectId");

-- CreateIndex
CREATE INDEX "test_documents_type_idx" ON "test_documents"("type");

-- CreateIndex
CREATE INDEX "test_documents_status_idx" ON "test_documents"("status");

-- AddForeignKey
ALTER TABLE "test_cases" ADD CONSTRAINT "test_cases_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_cases" ADD CONSTRAINT "test_cases_sourceDocId_fkey" FOREIGN KEY ("sourceDocId") REFERENCES "test_documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_runs" ADD CONSTRAINT "test_runs_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_run_results" ADD CONSTRAINT "test_run_results_testRunId_fkey" FOREIGN KEY ("testRunId") REFERENCES "test_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_run_results" ADD CONSTRAINT "test_run_results_testCaseId_fkey" FOREIGN KEY ("testCaseId") REFERENCES "test_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "model_configs" ADD CONSTRAINT "model_configs_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_documents" ADD CONSTRAINT "test_documents_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
