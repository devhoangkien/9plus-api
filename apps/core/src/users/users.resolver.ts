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
} from '@anineplus/authorization';
import { ResourceEnum } from 'src/common/enums';
import { User } from 'prisma/@generated';

@Resolver(() => User)
export class UsersResolver {
  constructor(private readonly userService: UsersService) {}

 

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

}
