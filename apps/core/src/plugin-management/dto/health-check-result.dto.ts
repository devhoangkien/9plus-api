import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class HealthCheckResult {
  @Field()
  plugin: string;

  @Field()
  healthy: boolean;
}