import { InputType, Field, ObjectType } from '@nestjs/graphql';
import { IsEmail, MinLength } from 'class-validator';

@InputType()
export class LoginUserInput {
  @Field()
  @IsEmail()
  email: string;

  @Field()
  @MinLength(6)
  password: string;
}

