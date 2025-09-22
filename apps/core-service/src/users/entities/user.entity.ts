import { ObjectType, Field, ID } from '@nestjs/graphql';
import { UserStatusEnum, GenderEnum, LoginMethod } from '@prisma/client';

@ObjectType()
export class User {
  @Field(() => ID)
  id: string;

  @Field()
  email: string;

  @Field({ nullable: true })
  phone?: string;

  @Field({ nullable: true })
  username?: string;

  @Field({ nullable: true })
  firstName?: string;

  @Field({ nullable: true })
  lastName?: string;

  @Field({ nullable: true })
  fullName?: string;

  @Field({ nullable: true })
  avatar?: string;

  @Field({ nullable: true })
  dateOfBirth?: Date;

  @Field(() => GenderEnum, { nullable: true })
  gender?: GenderEnum;

  @Field({ nullable: true })
  address?: string;

  @Field(() => UserStatusEnum)
  status: UserStatusEnum;

  @Field()
  emailVerified: boolean;

  @Field()
  phoneVerified: boolean;

  @Field()
  twoFactorEnabled: boolean;

  @Field()
  isFirstLogin: boolean;

  @Field(() => LoginMethod)
  loginMethod: LoginMethod;

  @Field({ nullable: true })
  lastLogin?: Date;

  @Field({ nullable: true })
  lastLoginIP?: string;

  @Field()
  failedLoginAttempts: number;

  @Field({ nullable: true })
  lockoutExpires?: Date;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field({ nullable: true })
  deletedAt?: Date;

  @Field({ nullable: true })
  createdBy?: string;

  @Field({ nullable: true })
  updatedBy?: string;
}
