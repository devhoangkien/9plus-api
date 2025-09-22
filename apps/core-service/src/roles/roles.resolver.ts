import { Args, Query, Resolver } from '@nestjs/graphql';
import { RolesService } from './roles.service';
import { Role } from 'prisma/@generated';

@Resolver()
export class RolesResolver {
  constructor(private readonly rolesService: RolesService) {}

  @Query(() => Role)
  async getRoleByKey(@Args('key') key: string) {
    return this.rolesService.getRolByKey(key);
  }

  @Query(() => [Role])
  async getRolesByKeys(@Args('keys') keys: string) {
    return this.rolesService.getRolesByKeys(keys);
  }
}
