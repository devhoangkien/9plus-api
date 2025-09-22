import { Resolver, Query, Mutation, Args, Context } from '@nestjs/graphql';

import { UsersService } from './users.service';
import { LoginUserInput, RegisterUserInput } from './inputs';
import { CheckUserExistDto, LoginResponse } from './dtos';
import { UseGuards } from '@nestjs/common';
import {
  AuthGuard,
  CaslActionEnum,
  CaslGuard,
  CheckPermissions,
} from '@bune/casl-authorization';
import { ResourceEnum } from 'src/common/enums';
import { User } from 'prisma/@generated';

@Resolver(() => User)
export class UsersResolver {
  constructor(private readonly userService: UsersService) {}

  @Mutation(() => User)
  async register(@Args('input') input: RegisterUserInput) {
    return this.userService.register(input);
  }

  @Mutation(() => LoginResponse)
  async login(@Args('input') input: LoginUserInput) {
    return this.userService.login(input);
  }

  @Query(() => User)
  @UseGuards(AuthGuard)
  async me(@Context() context) {
    const headers = context.req.headers;
    const userId = headers['userid'];
    return this.userService.findUserById(userId);
  }

  @Query(() => Boolean)
  async checkUserExists(@Args('data') data: CheckUserExistDto) {
    console.log('checkUserExists', data);
    return this.userService.checkUserExists(data);
  }

  @Mutation(() => Boolean)
  async logout(@Context() context) {
    const headers = context.req.headers;
    const token = headers['authorization'];
    if (!token) {
      return true;
    }
    return this.userService.logout(token);
  }
}
