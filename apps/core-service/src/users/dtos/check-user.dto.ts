import { InputType, Field } from '@nestjs/graphql';
import { IsEmail, IsOptional } from 'class-validator';

@InputType()
export class CheckUserExistDto{
    @Field({ nullable: true })
    @IsEmail()
    @IsOptional()
    email?: string;

    @Field({ nullable: true })
    @IsOptional()
    phone?: string;

    @Field({ nullable: true })
    @IsOptional()
    username?: string;
}
