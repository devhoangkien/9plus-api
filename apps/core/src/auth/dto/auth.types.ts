import { Field, InputType, ObjectType } from '@nestjs/graphql';

// ============ Input Types ============

@InputType()
export class SignUpInput {
  @Field()
  email: string;

  @Field()
  password: string;

  @Field({ nullable: true })
  name?: string;
}

@InputType()
export class SignInInput {
  @Field()
  email: string;

  @Field()
  password: string;
}

@InputType()
export class VerifyEmailInput {
  @Field()
  token: string;
}

@InputType()
export class ForgotPasswordInput {
  @Field()
  email: string;
}

@InputType()
export class ResetPasswordInput {
  @Field()
  token: string;

  @Field()
  newPassword: string;
}

@InputType()
export class ChangePasswordInput {
  @Field()
  currentPassword: string;

  @Field()
  newPassword: string;
}

// ============ Output Types ============

@ObjectType()
export class AuthUser {
  @Field()
  id: string;

  @Field()
  email: string;

  @Field()
  name: string;

  @Field({ nullable: true })
  image?: string;

  @Field()
  emailVerified: boolean;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

@ObjectType()
export class AuthResponse {
  @Field()
  success: boolean;

  @Field({ nullable: true })
  message?: string;

  @Field(() => AuthUser, { nullable: true })
  user?: AuthUser;

  @Field({ nullable: true })
  token?: string;
}

@ObjectType()
export class SessionData {
  @Field()
  id: string;

  @Field()
  userId: string;

  @Field()
  expiresAt: Date;

  @Field()
  token: string;

  @Field({ nullable: true })
  ipAddress?: string;

  @Field({ nullable: true })
  userAgent?: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

@ObjectType()
export class CurrentSessionResponse {
  @Field(() => SessionData)
  session: SessionData;

  @Field(() => AuthUser)
  user: AuthUser;
}

@ObjectType()
export class ListSessionsResponse {
  @Field(() => [SessionData])
  sessions: SessionData[];
}

@ObjectType()
export class VerifyAuthResponse {
  @Field()
  success: boolean;

  @Field({ nullable: true })
  message?: string;

  @Field(() => AuthUser, { nullable: true })
  user?: AuthUser;
}

@ObjectType()
export class BasicResponse {
  @Field()
  success: boolean;

  @Field({ nullable: true })
  message?: string;
}
