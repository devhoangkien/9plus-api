export type Maybe<T> = T | null | undefined;
export type InputMaybe<T> = T | null | undefined;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  /** A date-time string at UTC, such as 2019-12-03T09:54:33Z, compliant with the date-time format. */
  DateTime: { input: Date; output: Date; }
  _Any: { input: any; output: any; }
  federation__FieldSet: { input: any; output: any; }
  link__Import: { input: any; output: any; }
};

export type CheckUserExistDto = {
  email?: InputMaybe<Scalars['String']['input']>;
  phone?: InputMaybe<Scalars['String']['input']>;
  username?: InputMaybe<Scalars['String']['input']>;
};

export enum GenderEnum {
  Female = 'FEMALE',
  Male = 'MALE',
  Other = 'OTHER',
  PreferNotToSay = 'PREFER_NOT_TO_SAY'
}

export enum LoginMethod {
  Apple = 'APPLE',
  Facebook = 'FACEBOOK',
  Google = 'GOOGLE',
  Local = 'LOCAL',
  Microsoft = 'MICROSOFT',
  Sso = 'SSO'
}

export type LoginResponse = {
  __typename?: 'LoginResponse';
  accessToken: Scalars['String']['output'];
  refreshToken: Scalars['String']['output'];
  requiresTwoFactor?: Maybe<Scalars['Boolean']['output']>;
  user?: Maybe<User>;
  userId: Scalars['String']['output'];
};

export type LoginUserInput = {
  email: Scalars['String']['input'];
  password: Scalars['String']['input'];
};

export type Mutation = {
  __typename?: 'Mutation';
  changePassword: Scalars['Boolean']['output'];
  disableTwoFactor: Scalars['Boolean']['output'];
  enableTwoFactor: Scalars['Boolean']['output'];
  login: LoginResponse;
  logout: Scalars['Boolean']['output'];
  refreshToken: LoginResponse;
  register: User;
  requestPasswordReset: Scalars['Boolean']['output'];
  resetPassword: Scalars['Boolean']['output'];
  setupTwoFactor: Scalars['String']['output'];
  verifyTwoFactor: LoginResponse;
};


export type MutationChangePasswordArgs = {
  currentPassword: Scalars['String']['input'];
  newPassword: Scalars['String']['input'];
};


export type MutationDisableTwoFactorArgs = {
  password: Scalars['String']['input'];
};


export type MutationEnableTwoFactorArgs = {
  token: Scalars['String']['input'];
};


export type MutationLoginArgs = {
  input: LoginUserInput;
};


export type MutationRefreshTokenArgs = {
  refreshToken: Scalars['String']['input'];
};


export type MutationRegisterArgs = {
  input: RegisterUserInput;
};


export type MutationRequestPasswordResetArgs = {
  email: Scalars['String']['input'];
};


export type MutationResetPasswordArgs = {
  newPassword: Scalars['String']['input'];
  token: Scalars['String']['input'];
};


export type MutationVerifyTwoFactorArgs = {
  token: Scalars['String']['input'];
  userId: Scalars['String']['input'];
};

export type Permission = {
  __typename?: 'Permission';
  _count: PermissionCount;
  action: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  createdBy?: Maybe<Scalars['String']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  key: Scalars['String']['output'];
  name: Scalars['String']['output'];
  resource: Scalars['String']['output'];
  roles?: Maybe<Array<Role>>;
  scope: Scalars['String']['output'];
  status: PermissionStatusEnum;
  updatedAt: Scalars['DateTime']['output'];
  updatedBy?: Maybe<Scalars['String']['output']>;
};

export type PermissionCount = {
  __typename?: 'PermissionCount';
  roles: Scalars['Int']['output'];
};

export type PermissionCountAggregate = {
  __typename?: 'PermissionCountAggregate';
  _all: Scalars['Int']['output'];
  action: Scalars['Int']['output'];
  createdAt: Scalars['Int']['output'];
  createdBy: Scalars['Int']['output'];
  description: Scalars['Int']['output'];
  id: Scalars['Int']['output'];
  key: Scalars['Int']['output'];
  name: Scalars['Int']['output'];
  resource: Scalars['Int']['output'];
  scope: Scalars['Int']['output'];
  status: Scalars['Int']['output'];
  updatedAt: Scalars['Int']['output'];
  updatedBy: Scalars['Int']['output'];
};

export type PermissionMaxAggregate = {
  __typename?: 'PermissionMaxAggregate';
  action?: Maybe<Scalars['String']['output']>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  createdBy?: Maybe<Scalars['String']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  key?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  resource?: Maybe<Scalars['String']['output']>;
  scope?: Maybe<Scalars['String']['output']>;
  status?: Maybe<PermissionStatusEnum>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  updatedBy?: Maybe<Scalars['String']['output']>;
};

export type PermissionMinAggregate = {
  __typename?: 'PermissionMinAggregate';
  action?: Maybe<Scalars['String']['output']>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  createdBy?: Maybe<Scalars['String']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  key?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  resource?: Maybe<Scalars['String']['output']>;
  scope?: Maybe<Scalars['String']['output']>;
  status?: Maybe<PermissionStatusEnum>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  updatedBy?: Maybe<Scalars['String']['output']>;
};

export enum PermissionStatusEnum {
  Active = 'ACTIVE',
  Archived = 'ARCHIVED',
  Deprecated = 'DEPRECATED',
  Inactive = 'INACTIVE'
}

export type Query = {
  __typename?: 'Query';
  _service: _Service;
  checkUserExists: Scalars['Boolean']['output'];
  getRoleByKey: Role;
  getRolesByKeys: Array<Role>;
  me: User;
  validateToken: Scalars['Boolean']['output'];
};


export type QueryCheckUserExistsArgs = {
  data: CheckUserExistDto;
};


export type QueryGetRoleByKeyArgs = {
  key: Scalars['String']['input'];
};


export type QueryGetRolesByKeysArgs = {
  keys: Scalars['String']['input'];
};

export type RegisterUserInput = {
  email: Scalars['String']['input'];
  password: Scalars['String']['input'];
};

export type Role = {
  __typename?: 'Role';
  _count: RoleCount;
  createdAt: Scalars['DateTime']['output'];
  createdBy?: Maybe<Scalars['String']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  isSystemRole: Scalars['Boolean']['output'];
  key: Scalars['String']['output'];
  level: Scalars['Int']['output'];
  name: Scalars['String']['output'];
  permissions?: Maybe<Array<Permission>>;
  status: RoleStatusEnum;
  updatedAt: Scalars['DateTime']['output'];
  updatedBy?: Maybe<Scalars['String']['output']>;
  users?: Maybe<Array<User>>;
};

export type RoleAvgAggregate = {
  __typename?: 'RoleAvgAggregate';
  level?: Maybe<Scalars['Float']['output']>;
};

export type RoleCount = {
  __typename?: 'RoleCount';
  permissions: Scalars['Int']['output'];
  users: Scalars['Int']['output'];
};

export type RoleCountAggregate = {
  __typename?: 'RoleCountAggregate';
  _all: Scalars['Int']['output'];
  createdAt: Scalars['Int']['output'];
  createdBy: Scalars['Int']['output'];
  description: Scalars['Int']['output'];
  id: Scalars['Int']['output'];
  isSystemRole: Scalars['Int']['output'];
  key: Scalars['Int']['output'];
  level: Scalars['Int']['output'];
  name: Scalars['Int']['output'];
  status: Scalars['Int']['output'];
  updatedAt: Scalars['Int']['output'];
  updatedBy: Scalars['Int']['output'];
};

export type RoleMaxAggregate = {
  __typename?: 'RoleMaxAggregate';
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  createdBy?: Maybe<Scalars['String']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  isSystemRole?: Maybe<Scalars['Boolean']['output']>;
  key?: Maybe<Scalars['String']['output']>;
  level?: Maybe<Scalars['Int']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  status?: Maybe<RoleStatusEnum>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  updatedBy?: Maybe<Scalars['String']['output']>;
};

export type RoleMinAggregate = {
  __typename?: 'RoleMinAggregate';
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  createdBy?: Maybe<Scalars['String']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  isSystemRole?: Maybe<Scalars['Boolean']['output']>;
  key?: Maybe<Scalars['String']['output']>;
  level?: Maybe<Scalars['Int']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  status?: Maybe<RoleStatusEnum>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  updatedBy?: Maybe<Scalars['String']['output']>;
};

export enum RoleStatusEnum {
  Active = 'ACTIVE',
  Archived = 'ARCHIVED',
  Deprecated = 'DEPRECATED',
  Inactive = 'INACTIVE'
}

export type RoleSumAggregate = {
  __typename?: 'RoleSumAggregate';
  level?: Maybe<Scalars['Int']['output']>;
};

export type User = {
  __typename?: 'User';
  _count: UserCount;
  address?: Maybe<Scalars['String']['output']>;
  avatar?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  createdBy?: Maybe<Scalars['String']['output']>;
  dateOfBirth?: Maybe<Scalars['DateTime']['output']>;
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  email: Scalars['String']['output'];
  emailVerificationExpires?: Maybe<Scalars['DateTime']['output']>;
  emailVerificationToken?: Maybe<Scalars['String']['output']>;
  emailVerified: Scalars['Boolean']['output'];
  failedLoginAttempts: Scalars['Int']['output'];
  firstName?: Maybe<Scalars['String']['output']>;
  fullName?: Maybe<Scalars['String']['output']>;
  gender?: Maybe<GenderEnum>;
  id: Scalars['ID']['output'];
  isFirstLogin: Scalars['Boolean']['output'];
  lastLogin?: Maybe<Scalars['DateTime']['output']>;
  lastLoginIP?: Maybe<Scalars['String']['output']>;
  lastName?: Maybe<Scalars['String']['output']>;
  lockoutExpires?: Maybe<Scalars['DateTime']['output']>;
  loginMethod: LoginMethod;
  passwordResetExpires?: Maybe<Scalars['DateTime']['output']>;
  passwordResetToken?: Maybe<Scalars['String']['output']>;
  phone?: Maybe<Scalars['String']['output']>;
  phoneVerified: Scalars['Boolean']['output'];
  roles?: Maybe<Array<Role>>;
  status: UserStatusEnum;
  twoFactorEnabled: Scalars['Boolean']['output'];
  twoFactorSecret?: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['DateTime']['output'];
  updatedBy?: Maybe<Scalars['String']['output']>;
  userSessions?: Maybe<Array<UserSession>>;
  username: Scalars['String']['output'];
};

export type UserAvgAggregate = {
  __typename?: 'UserAvgAggregate';
  failedLoginAttempts?: Maybe<Scalars['Float']['output']>;
};

export type UserCount = {
  __typename?: 'UserCount';
  roles: Scalars['Int']['output'];
  userSessions: Scalars['Int']['output'];
};

export type UserCountAggregate = {
  __typename?: 'UserCountAggregate';
  _all: Scalars['Int']['output'];
  address: Scalars['Int']['output'];
  avatar: Scalars['Int']['output'];
  createdAt: Scalars['Int']['output'];
  createdBy: Scalars['Int']['output'];
  dateOfBirth: Scalars['Int']['output'];
  deletedAt: Scalars['Int']['output'];
  email: Scalars['Int']['output'];
  emailVerificationExpires: Scalars['Int']['output'];
  emailVerificationToken: Scalars['Int']['output'];
  emailVerified: Scalars['Int']['output'];
  failedLoginAttempts: Scalars['Int']['output'];
  firstName: Scalars['Int']['output'];
  fullName: Scalars['Int']['output'];
  gender: Scalars['Int']['output'];
  id: Scalars['Int']['output'];
  isFirstLogin: Scalars['Int']['output'];
  lastLogin: Scalars['Int']['output'];
  lastLoginIP: Scalars['Int']['output'];
  lastName: Scalars['Int']['output'];
  lockoutExpires: Scalars['Int']['output'];
  loginMethod: Scalars['Int']['output'];
  passwordResetExpires: Scalars['Int']['output'];
  passwordResetToken: Scalars['Int']['output'];
  phone: Scalars['Int']['output'];
  phoneVerified: Scalars['Int']['output'];
  status: Scalars['Int']['output'];
  twoFactorEnabled: Scalars['Int']['output'];
  twoFactorSecret: Scalars['Int']['output'];
  updatedAt: Scalars['Int']['output'];
  updatedBy: Scalars['Int']['output'];
  username: Scalars['Int']['output'];
};

export type UserMaxAggregate = {
  __typename?: 'UserMaxAggregate';
  address?: Maybe<Scalars['String']['output']>;
  avatar?: Maybe<Scalars['String']['output']>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  createdBy?: Maybe<Scalars['String']['output']>;
  dateOfBirth?: Maybe<Scalars['DateTime']['output']>;
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  email?: Maybe<Scalars['String']['output']>;
  emailVerificationExpires?: Maybe<Scalars['DateTime']['output']>;
  emailVerificationToken?: Maybe<Scalars['String']['output']>;
  emailVerified?: Maybe<Scalars['Boolean']['output']>;
  failedLoginAttempts?: Maybe<Scalars['Int']['output']>;
  firstName?: Maybe<Scalars['String']['output']>;
  fullName?: Maybe<Scalars['String']['output']>;
  gender?: Maybe<GenderEnum>;
  id?: Maybe<Scalars['String']['output']>;
  isFirstLogin?: Maybe<Scalars['Boolean']['output']>;
  lastLogin?: Maybe<Scalars['DateTime']['output']>;
  lastLoginIP?: Maybe<Scalars['String']['output']>;
  lastName?: Maybe<Scalars['String']['output']>;
  lockoutExpires?: Maybe<Scalars['DateTime']['output']>;
  loginMethod?: Maybe<LoginMethod>;
  passwordResetExpires?: Maybe<Scalars['DateTime']['output']>;
  passwordResetToken?: Maybe<Scalars['String']['output']>;
  phone?: Maybe<Scalars['String']['output']>;
  phoneVerified?: Maybe<Scalars['Boolean']['output']>;
  status?: Maybe<UserStatusEnum>;
  twoFactorEnabled?: Maybe<Scalars['Boolean']['output']>;
  twoFactorSecret?: Maybe<Scalars['String']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  updatedBy?: Maybe<Scalars['String']['output']>;
  username?: Maybe<Scalars['String']['output']>;
};

export type UserMinAggregate = {
  __typename?: 'UserMinAggregate';
  address?: Maybe<Scalars['String']['output']>;
  avatar?: Maybe<Scalars['String']['output']>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  createdBy?: Maybe<Scalars['String']['output']>;
  dateOfBirth?: Maybe<Scalars['DateTime']['output']>;
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  email?: Maybe<Scalars['String']['output']>;
  emailVerificationExpires?: Maybe<Scalars['DateTime']['output']>;
  emailVerificationToken?: Maybe<Scalars['String']['output']>;
  emailVerified?: Maybe<Scalars['Boolean']['output']>;
  failedLoginAttempts?: Maybe<Scalars['Int']['output']>;
  firstName?: Maybe<Scalars['String']['output']>;
  fullName?: Maybe<Scalars['String']['output']>;
  gender?: Maybe<GenderEnum>;
  id?: Maybe<Scalars['String']['output']>;
  isFirstLogin?: Maybe<Scalars['Boolean']['output']>;
  lastLogin?: Maybe<Scalars['DateTime']['output']>;
  lastLoginIP?: Maybe<Scalars['String']['output']>;
  lastName?: Maybe<Scalars['String']['output']>;
  lockoutExpires?: Maybe<Scalars['DateTime']['output']>;
  loginMethod?: Maybe<LoginMethod>;
  passwordResetExpires?: Maybe<Scalars['DateTime']['output']>;
  passwordResetToken?: Maybe<Scalars['String']['output']>;
  phone?: Maybe<Scalars['String']['output']>;
  phoneVerified?: Maybe<Scalars['Boolean']['output']>;
  status?: Maybe<UserStatusEnum>;
  twoFactorEnabled?: Maybe<Scalars['Boolean']['output']>;
  twoFactorSecret?: Maybe<Scalars['String']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  updatedBy?: Maybe<Scalars['String']['output']>;
  username?: Maybe<Scalars['String']['output']>;
};

export type UserSession = {
  __typename?: 'UserSession';
  createdAt: Scalars['DateTime']['output'];
  deviceInfo?: Maybe<Scalars['String']['output']>;
  expiresAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  ipAddress?: Maybe<Scalars['String']['output']>;
  isActive: Scalars['Boolean']['output'];
  lastActivity: Scalars['DateTime']['output'];
  refreshToken?: Maybe<Scalars['String']['output']>;
  sessionToken: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
  user: User;
  userAgent?: Maybe<Scalars['String']['output']>;
  userId: Scalars['String']['output'];
};

export type UserSessionCountAggregate = {
  __typename?: 'UserSessionCountAggregate';
  _all: Scalars['Int']['output'];
  createdAt: Scalars['Int']['output'];
  deviceInfo: Scalars['Int']['output'];
  expiresAt: Scalars['Int']['output'];
  id: Scalars['Int']['output'];
  ipAddress: Scalars['Int']['output'];
  isActive: Scalars['Int']['output'];
  lastActivity: Scalars['Int']['output'];
  refreshToken: Scalars['Int']['output'];
  sessionToken: Scalars['Int']['output'];
  updatedAt: Scalars['Int']['output'];
  userAgent: Scalars['Int']['output'];
  userId: Scalars['Int']['output'];
};

export type UserSessionMaxAggregate = {
  __typename?: 'UserSessionMaxAggregate';
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  deviceInfo?: Maybe<Scalars['String']['output']>;
  expiresAt?: Maybe<Scalars['DateTime']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  ipAddress?: Maybe<Scalars['String']['output']>;
  isActive?: Maybe<Scalars['Boolean']['output']>;
  lastActivity?: Maybe<Scalars['DateTime']['output']>;
  refreshToken?: Maybe<Scalars['String']['output']>;
  sessionToken?: Maybe<Scalars['String']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  userAgent?: Maybe<Scalars['String']['output']>;
  userId?: Maybe<Scalars['String']['output']>;
};

export type UserSessionMinAggregate = {
  __typename?: 'UserSessionMinAggregate';
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  deviceInfo?: Maybe<Scalars['String']['output']>;
  expiresAt?: Maybe<Scalars['DateTime']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  ipAddress?: Maybe<Scalars['String']['output']>;
  isActive?: Maybe<Scalars['Boolean']['output']>;
  lastActivity?: Maybe<Scalars['DateTime']['output']>;
  refreshToken?: Maybe<Scalars['String']['output']>;
  sessionToken?: Maybe<Scalars['String']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  userAgent?: Maybe<Scalars['String']['output']>;
  userId?: Maybe<Scalars['String']['output']>;
};

export enum UserStatusEnum {
  Active = 'ACTIVE',
  Archived = 'ARCHIVED',
  Inactive = 'INACTIVE',
  Locked = 'LOCKED',
  PendingVerification = 'PENDING_VERIFICATION',
  Suspended = 'SUSPENDED'
}

export type UserSumAggregate = {
  __typename?: 'UserSumAggregate';
  failedLoginAttempts?: Maybe<Scalars['Int']['output']>;
};

export type _Service = {
  __typename?: '_Service';
  sdl?: Maybe<Scalars['String']['output']>;
};

export enum Link__Purpose {
  /** `EXECUTION` features provide metadata necessary for operation execution. */
  Execution = 'EXECUTION',
  /** `SECURITY` features provide metadata necessary to securely resolve fields. */
  Security = 'SECURITY'
}
