import { Resolver } from '@nestjs/graphql';
import { PermissionsService } from './permissions.service';
import { Query, Args } from '@nestjs/graphql';

@Resolver()
export class PermissionsResolver {
  constructor(private readonly permissionsService: PermissionsService) {}
}
