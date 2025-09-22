import { Field, ObjectType } from "@nestjs/graphql";
import { User } from 'prisma/@generated';

@ObjectType()
export class LoginResponse {
    @Field()
    accessToken: string;

    @Field()
    refreshToken: string;

    @Field()
    userId: string;

    @Field(() => User, { nullable: true })
    user?: User;

    @Field({ nullable: true })
    requiresTwoFactor?: boolean;
}
