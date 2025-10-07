import { ObjectType, Field } from '@nestjs/graphql';

/**
 * Health Check Result DTO
 * 
 * Represents the health check status of a registered plugin/service.
 */
@ObjectType('HealthCheckResultType')
export class HealthCheckResult {
  @Field()
  plugin: string;

  @Field()
  healthy: boolean;
}