import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class GatewaySubgraph {
  @Field()
  name: string;

  @Field()
  url: string;
}