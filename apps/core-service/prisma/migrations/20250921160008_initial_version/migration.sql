/*
  Warnings:

  - You are about to drop the `audit_logs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `login_logs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `notification_settings` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `student_attendance` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `student_classes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `student_grades` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `students` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `teacher_classes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `teacher_students` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `teachers` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "audit_logs" DROP CONSTRAINT "audit_logs_userId_fkey";

-- DropForeignKey
ALTER TABLE "login_logs" DROP CONSTRAINT "login_logs_userId_fkey";

-- DropForeignKey
ALTER TABLE "notification_settings" DROP CONSTRAINT "notification_settings_userId_fkey";

-- DropForeignKey
ALTER TABLE "student_attendance" DROP CONSTRAINT "student_attendance_studentId_fkey";

-- DropForeignKey
ALTER TABLE "student_classes" DROP CONSTRAINT "student_classes_studentId_fkey";

-- DropForeignKey
ALTER TABLE "student_grades" DROP CONSTRAINT "student_grades_studentId_fkey";

-- DropForeignKey
ALTER TABLE "students" DROP CONSTRAINT "students_userId_fkey";

-- DropForeignKey
ALTER TABLE "teacher_classes" DROP CONSTRAINT "teacher_classes_teacherId_fkey";

-- DropForeignKey
ALTER TABLE "teacher_students" DROP CONSTRAINT "teacher_students_studentId_fkey";

-- DropForeignKey
ALTER TABLE "teacher_students" DROP CONSTRAINT "teacher_students_teacherId_fkey";

-- DropForeignKey
ALTER TABLE "teachers" DROP CONSTRAINT "teachers_userId_fkey";

-- DropTable
DROP TABLE "audit_logs";

-- DropTable
DROP TABLE "login_logs";

-- DropTable
DROP TABLE "notification_settings";

-- DropTable
DROP TABLE "student_attendance";

-- DropTable
DROP TABLE "student_classes";

-- DropTable
DROP TABLE "student_grades";

-- DropTable
DROP TABLE "students";

-- DropTable
DROP TABLE "teacher_classes";

-- DropTable
DROP TABLE "teacher_students";

-- DropTable
DROP TABLE "teachers";
