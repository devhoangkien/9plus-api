import { registerEnumType } from '@nestjs/graphql';
import { 
  UserStatusEnum, 
  GenderEnum, 
  LoginMethod, 
  RoleStatusEnum, 
  PermissionStatusEnum,
  EmploymentType,
  ContactMethod,
  TeacherStudentType,
  StudentClassStatus,
  EnrollmentStatus,
  ExamType,
  AttendanceStatus,
  LoginStatus
} from '@prisma/client';

// Register all Prisma enums as GraphQL enums
registerEnumType(UserStatusEnum, {
  name: 'UserStatusEnum',
  description: 'User account status',
});

registerEnumType(GenderEnum, {
  name: 'GenderEnum',
  description: 'User gender options',
});

registerEnumType(LoginMethod, {
  name: 'LoginMethod',
  description: 'Authentication login methods',
});

registerEnumType(RoleStatusEnum, {
  name: 'RoleStatusEnum',
  description: 'Role status options',
});

registerEnumType(PermissionStatusEnum, {
  name: 'PermissionStatusEnum',
  description: 'Permission status options',
});

registerEnumType(EmploymentType, {
  name: 'EmploymentType',
  description: 'Teacher employment types',
});

registerEnumType(ContactMethod, {
  name: 'ContactMethod',
  description: 'Contact method options',
});

registerEnumType(TeacherStudentType, {
  name: 'TeacherStudentType',
  description: 'Teacher-student relationship types',
});

registerEnumType(StudentClassStatus, {
  name: 'StudentClassStatus',
  description: 'Student class enrollment status',
});

registerEnumType(EnrollmentStatus, {
  name: 'EnrollmentStatus',
  description: 'Student enrollment status',
});

registerEnumType(ExamType, {
  name: 'ExamType',
  description: 'Types of exams and assessments',
});

registerEnumType(AttendanceStatus, {
  name: 'AttendanceStatus',
  description: 'Student attendance status options',
});

registerEnumType(LoginStatus, {
  name: 'LoginStatus',
  description: 'Login attempt status',
});
