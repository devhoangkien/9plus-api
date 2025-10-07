import { ObjectType, Field } from '@nestjs/graphql';

/**
 * Gateway Subgraph DTO
 * 
 * Represents a GraphQL subgraph configuration for Apollo Federation Gateway.
 * Used by plugin-management service to expose registered services to the gateway.
 */
@ObjectType('GatewaySubgraphType')
export class GatewaySubgraph {
  @Field()
  name: string;

  @Field()
  url: string;
}