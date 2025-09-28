import { InputType, Field } from "@nestjs/graphql";

@InputType()
class LoginUserInput {
  @Field()
  email: string;

  @Field()
  password: string;
}
