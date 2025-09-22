-- CreateEnum
CREATE TYPE "UserStatusEnum" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'LOCKED', 'PENDING_VERIFICATION', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "GenderEnum" AS ENUM ('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY');

-- CreateEnum
CREATE TYPE "LoginMethod" AS ENUM ('LOCAL', 'GOOGLE', 'FACEBOOK', 'MICROSOFT', 'APPLE', 'SSO');

-- CreateEnum
CREATE TYPE "LoginStatus" AS ENUM ('SUCCESS', 'FAILED', 'BLOCKED', 'LOCKED_OUT', 'INVALID_CREDENTIALS', 'ACCOUNT_DISABLED');

-- CreateEnum
CREATE TYPE "RoleStatusEnum" AS ENUM ('ACTIVE', 'INACTIVE', 'DEPRECATED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "PermissionStatusEnum" AS ENUM ('ACTIVE', 'INACTIVE', 'DEPRECATED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "EmploymentType" AS ENUM ('FULL_TIME', 'PART_TIME', 'CONTRACT', 'SUBSTITUTE', 'VOLUNTEER');

-- CreateEnum
CREATE TYPE "ContactMethod" AS ENUM ('EMAIL', 'PHONE', 'SMS', 'MAIL', 'APP_NOTIFICATION');

-- CreateEnum
CREATE TYPE "TeacherStudentType" AS ENUM ('CLASS_TEACHER', 'SUBJECT_TEACHER', 'SUBSTITUTE_TEACHER', 'MENTOR', 'COUNSELOR');

-- CreateEnum
CREATE TYPE "StudentClassStatus" AS ENUM ('ENROLLED', 'COMPLETED', 'DROPPED', 'TRANSFERRED', 'SUSPENDED', 'GRADUATED');

-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('ACTIVE', 'GRADUATED', 'TRANSFERRED', 'DROPPED', 'SUSPENDED', 'EXPELLED', 'ON_LEAVE');

-- CreateEnum
CREATE TYPE "ExamType" AS ENUM ('QUIZ', 'TEST', 'MIDTERM', 'FINAL', 'ASSIGNMENT', 'PROJECT', 'PRESENTATION', 'LAB_WORK', 'PRACTICAL', 'ORAL_EXAM', 'PORTFOLIO', 'HOMEWORK');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'LATE', 'EXCUSED', 'SICK', 'HALF_DAY', 'EARLY_DISMISSAL');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "password" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "fullName" TEXT,
    "avatar" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "gender" "GenderEnum",
    "address" TEXT,
    "status" "UserStatusEnum" NOT NULL DEFAULT 'INACTIVE',
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "phoneVerified" BOOLEAN NOT NULL DEFAULT false,
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "isFirstLogin" BOOLEAN NOT NULL DEFAULT true,
    "loginMethod" "LoginMethod" NOT NULL DEFAULT 'LOCAL',
    "lastLogin" TIMESTAMP(3),
    "lastLoginIP" TEXT,
    "passwordResetToken" TEXT,
    "passwordResetExpires" TIMESTAMP(3),
    "emailVerificationToken" TEXT,
    "emailVerificationExpires" TIMESTAMP(3),
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockoutExpires" TIMESTAMP(3),
    "twoFactorSecret" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "deviceInfo" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastActivity" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "login_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "email" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "loginMethod" "LoginMethod" NOT NULL DEFAULT 'LOCAL',
    "status" "LoginStatus" NOT NULL,
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "login_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "resourceId" TEXT,
    "oldValues" JSONB,
    "newValues" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_settings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emailNewsletter" BOOLEAN NOT NULL DEFAULT true,
    "emailAnnouncements" BOOLEAN NOT NULL DEFAULT true,
    "emailReminders" BOOLEAN NOT NULL DEFAULT true,
    "emailSecurity" BOOLEAN NOT NULL DEFAULT true,
    "smsReminders" BOOLEAN NOT NULL DEFAULT false,
    "smsSecurity" BOOLEAN NOT NULL DEFAULT true,
    "pushNotifications" BOOLEAN NOT NULL DEFAULT true,
    "pushReminders" BOOLEAN NOT NULL DEFAULT true,
    "classNotifications" BOOLEAN NOT NULL DEFAULT true,
    "gradeNotifications" BOOLEAN NOT NULL DEFAULT true,
    "attendanceNotifications" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teachers" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "employeeId" TEXT,
    "department" TEXT,
    "subjects" TEXT[],
    "specialization" TEXT,
    "qualifications" JSONB,
    "experience" INTEGER DEFAULT 0,
    "hireDate" TIMESTAMP(3),
    "officeLocation" TEXT,
    "officeHours" TEXT,
    "professionalEmail" TEXT,
    "professionalPhone" TEXT,
    "bio" TEXT,
    "employmentType" "EmploymentType" NOT NULL DEFAULT 'FULL_TIME',
    "salary" DOUBLE PRECISION,
    "workSchedule" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "teachers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "students" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "studentId" TEXT,
    "grade" TEXT,
    "section" TEXT,
    "academicYear" TEXT,
    "enrollmentDate" TIMESTAMP(3),
    "expectedGraduation" TIMESTAMP(3),
    "guardianName" TEXT,
    "guardianEmail" TEXT,
    "guardianPhone" TEXT,
    "guardianRelation" TEXT,
    "emergencyContact" TEXT,
    "medicalInfo" JSONB,
    "currentGPA" DOUBLE PRECISION,
    "totalCredits" INTEGER DEFAULT 0,
    "attendanceRate" DOUBLE PRECISION DEFAULT 100,
    "behaviorScore" INTEGER DEFAULT 100,
    "enrollmentStatus" "EnrollmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teacher_classes" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "className" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "isClassTeacher" BOOLEAN NOT NULL DEFAULT false,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teacher_classes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_classes" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "className" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "enrollmentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "StudentClassStatus" NOT NULL DEFAULT 'ENROLLED',
    "finalGrade" TEXT,
    "completionDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_classes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teacher_students" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "relationship" "TeacherStudentType" NOT NULL DEFAULT 'SUBJECT_TEACHER',
    "subject" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teacher_students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_grades" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "examType" "ExamType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "maxScore" DOUBLE PRECISION NOT NULL,
    "actualScore" DOUBLE PRECISION NOT NULL,
    "percentage" DOUBLE PRECISION,
    "letterGrade" TEXT,
    "gradePoints" DOUBLE PRECISION,
    "examDate" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "submittedDate" TIMESTAMP(3),
    "gradedDate" TIMESTAMP(3),
    "teacherNotes" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_grades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_attendance" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "subject" TEXT,
    "classId" TEXT,
    "period" TEXT,
    "status" "AttendanceStatus" NOT NULL DEFAULT 'PRESENT',
    "checkInTime" TIMESTAMP(3),
    "checkOutTime" TIMESTAMP(3),
    "reason" TEXT,
    "isExcused" BOOLEAN NOT NULL DEFAULT false,
    "remarks" TEXT,
    "markedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "description" TEXT,
    "level" INTEGER NOT NULL DEFAULT 1,
    "isSystemRole" BOOLEAN NOT NULL DEFAULT false,
    "status" "RoleStatusEnum" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "description" TEXT,
    "resource" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "scope" TEXT NOT NULL DEFAULT 'OWN',
    "status" "PermissionStatusEnum" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_UserRoles" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_UserRoles_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_RolePermissions" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_RolePermissions_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_username_idx" ON "users"("username");

-- CreateIndex
CREATE INDEX "users_phone_idx" ON "users"("phone");

-- CreateIndex
CREATE INDEX "users_status_idx" ON "users"("status");

-- CreateIndex
CREATE INDEX "users_emailVerified_idx" ON "users"("emailVerified");

-- CreateIndex
CREATE INDEX "users_lastLogin_idx" ON "users"("lastLogin");

-- CreateIndex
CREATE UNIQUE INDEX "user_sessions_sessionToken_key" ON "user_sessions"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "user_sessions_refreshToken_key" ON "user_sessions"("refreshToken");

-- CreateIndex
CREATE INDEX "user_sessions_userId_idx" ON "user_sessions"("userId");

-- CreateIndex
CREATE INDEX "user_sessions_sessionToken_idx" ON "user_sessions"("sessionToken");

-- CreateIndex
CREATE INDEX "user_sessions_isActive_idx" ON "user_sessions"("isActive");

-- CreateIndex
CREATE INDEX "user_sessions_expiresAt_idx" ON "user_sessions"("expiresAt");

-- CreateIndex
CREATE INDEX "login_logs_userId_idx" ON "login_logs"("userId");

-- CreateIndex
CREATE INDEX "login_logs_email_idx" ON "login_logs"("email");

-- CreateIndex
CREATE INDEX "login_logs_status_idx" ON "login_logs"("status");

-- CreateIndex
CREATE INDEX "login_logs_createdAt_idx" ON "login_logs"("createdAt");

-- CreateIndex
CREATE INDEX "login_logs_ipAddress_idx" ON "login_logs"("ipAddress");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_resource_idx" ON "audit_logs"("resource");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "notification_settings_userId_key" ON "notification_settings"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "teachers_userId_key" ON "teachers"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "teachers_employeeId_key" ON "teachers"("employeeId");

-- CreateIndex
CREATE INDEX "teachers_employeeId_idx" ON "teachers"("employeeId");

-- CreateIndex
CREATE INDEX "teachers_department_idx" ON "teachers"("department");

-- CreateIndex
CREATE INDEX "teachers_isActive_idx" ON "teachers"("isActive");

-- CreateIndex
CREATE INDEX "teachers_employmentType_idx" ON "teachers"("employmentType");

-- CreateIndex
CREATE UNIQUE INDEX "students_userId_key" ON "students"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "students_studentId_key" ON "students"("studentId");

-- CreateIndex
CREATE INDEX "students_studentId_idx" ON "students"("studentId");

-- CreateIndex
CREATE INDEX "students_grade_idx" ON "students"("grade");

-- CreateIndex
CREATE INDEX "students_section_idx" ON "students"("section");

-- CreateIndex
CREATE INDEX "students_academicYear_idx" ON "students"("academicYear");

-- CreateIndex
CREATE INDEX "students_enrollmentStatus_idx" ON "students"("enrollmentStatus");

-- CreateIndex
CREATE INDEX "students_isActive_idx" ON "students"("isActive");

-- CreateIndex
CREATE INDEX "teacher_classes_teacherId_idx" ON "teacher_classes"("teacherId");

-- CreateIndex
CREATE INDEX "teacher_classes_classId_idx" ON "teacher_classes"("classId");

-- CreateIndex
CREATE INDEX "teacher_classes_subject_idx" ON "teacher_classes"("subject");

-- CreateIndex
CREATE INDEX "teacher_classes_isActive_idx" ON "teacher_classes"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "teacher_classes_teacherId_classId_subject_key" ON "teacher_classes"("teacherId", "classId", "subject");

-- CreateIndex
CREATE INDEX "student_classes_studentId_idx" ON "student_classes"("studentId");

-- CreateIndex
CREATE INDEX "student_classes_classId_idx" ON "student_classes"("classId");

-- CreateIndex
CREATE INDEX "student_classes_subject_idx" ON "student_classes"("subject");

-- CreateIndex
CREATE INDEX "student_classes_status_idx" ON "student_classes"("status");

-- CreateIndex
CREATE UNIQUE INDEX "student_classes_studentId_classId_subject_key" ON "student_classes"("studentId", "classId", "subject");

-- CreateIndex
CREATE INDEX "teacher_students_teacherId_idx" ON "teacher_students"("teacherId");

-- CreateIndex
CREATE INDEX "teacher_students_studentId_idx" ON "teacher_students"("studentId");

-- CreateIndex
CREATE INDEX "teacher_students_relationship_idx" ON "teacher_students"("relationship");

-- CreateIndex
CREATE INDEX "teacher_students_isActive_idx" ON "teacher_students"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "teacher_students_teacherId_studentId_relationship_subject_key" ON "teacher_students"("teacherId", "studentId", "relationship", "subject");

-- CreateIndex
CREATE INDEX "student_grades_studentId_idx" ON "student_grades"("studentId");

-- CreateIndex
CREATE INDEX "student_grades_subject_idx" ON "student_grades"("subject");

-- CreateIndex
CREATE INDEX "student_grades_examType_idx" ON "student_grades"("examType");

-- CreateIndex
CREATE INDEX "student_grades_examDate_idx" ON "student_grades"("examDate");

-- CreateIndex
CREATE INDEX "student_grades_isPublished_idx" ON "student_grades"("isPublished");

-- CreateIndex
CREATE INDEX "student_attendance_studentId_idx" ON "student_attendance"("studentId");

-- CreateIndex
CREATE INDEX "student_attendance_date_idx" ON "student_attendance"("date");

-- CreateIndex
CREATE INDEX "student_attendance_status_idx" ON "student_attendance"("status");

-- CreateIndex
CREATE INDEX "student_attendance_subject_idx" ON "student_attendance"("subject");

-- CreateIndex
CREATE UNIQUE INDEX "student_attendance_studentId_date_subject_period_key" ON "student_attendance"("studentId", "date", "subject", "period");

-- CreateIndex
CREATE UNIQUE INDEX "roles_key_key" ON "roles"("key");

-- CreateIndex
CREATE INDEX "roles_key_idx" ON "roles"("key");

-- CreateIndex
CREATE INDEX "roles_status_idx" ON "roles"("status");

-- CreateIndex
CREATE INDEX "roles_level_idx" ON "roles"("level");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_key_key" ON "permissions"("key");

-- CreateIndex
CREATE INDEX "permissions_key_idx" ON "permissions"("key");

-- CreateIndex
CREATE INDEX "permissions_resource_action_idx" ON "permissions"("resource", "action");

-- CreateIndex
CREATE INDEX "permissions_status_idx" ON "permissions"("status");

-- CreateIndex
CREATE INDEX "_UserRoles_B_index" ON "_UserRoles"("B");

-- CreateIndex
CREATE INDEX "_RolePermissions_B_index" ON "_RolePermissions"("B");

-- AddForeignKey
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "login_logs" ADD CONSTRAINT "login_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_settings" ADD CONSTRAINT "notification_settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teachers" ADD CONSTRAINT "teachers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_classes" ADD CONSTRAINT "teacher_classes_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "teachers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_classes" ADD CONSTRAINT "student_classes_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_students" ADD CONSTRAINT "teacher_students_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "teachers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_students" ADD CONSTRAINT "teacher_students_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_grades" ADD CONSTRAINT "student_grades_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_attendance" ADD CONSTRAINT "student_attendance_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserRoles" ADD CONSTRAINT "_UserRoles_A_fkey" FOREIGN KEY ("A") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserRoles" ADD CONSTRAINT "_UserRoles_B_fkey" FOREIGN KEY ("B") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RolePermissions" ADD CONSTRAINT "_RolePermissions_A_fkey" FOREIGN KEY ("A") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RolePermissions" ADD CONSTRAINT "_RolePermissions_B_fkey" FOREIGN KEY ("B") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
