import { ObjectType, Field, ID, InputType, registerEnumType } from '@nestjs/graphql';

// Enums
export enum CheckoutType {
    SUBSCRIPTION = 'SUBSCRIPTION',
    ONE_TIME = 'ONE_TIME',
}

export enum PaymentResultType {
    REDIRECT = 'redirect',
    QR = 'qr',
    CLIENT_SECRET = 'client_secret',
    COMPLETED = 'completed',
}

registerEnumType(CheckoutType, { name: 'CheckoutType' });
registerEnumType(PaymentResultType, { name: 'PaymentResultType' });

// Input Types
@InputType()
export class CheckoutInput {
    @Field()
    userId: string;

    @Field(() => CheckoutType)
    type: CheckoutType;

    @Field({ nullable: true })
    planId?: string;

    @Field({ nullable: true })
    productId?: string;

    @Field({ nullable: true })
    paymentMethodId?: string;

    @Field({ nullable: true, defaultValue: 'STRIPE' })
    provider?: string;

    @Field({ nullable: true })
    successUrl?: string;

    @Field({ nullable: true })
    cancelUrl?: string;
}

@InputType()
export class ProcessPaymentInput {
    @Field(() => ID)
    invoiceId: string;

    @Field()
    paymentMethodId: string;

    @Field({ nullable: true, defaultValue: 'STRIPE' })
    provider?: string;
}

// Output Types
@ObjectType()
export class CheckoutSession {
    @Field(() => ID)
    id: string;

    @Field()
    type: string;

    @Field({ nullable: true })
    redirectUrl?: string;

    @Field({ nullable: true })
    clientSecret?: string;

    @Field({ nullable: true })
    qrCode?: string;

    @Field({ nullable: true })
    invoiceId?: string;

    @Field({ nullable: true })
    subscriptionId?: string;

    @Field()
    expiresAt: Date;
}

@ObjectType()
export class PaymentResult {
    @Field(() => PaymentResultType)
    type: PaymentResultType;

    @Field({ nullable: true })
    redirectUrl?: string;

    @Field({ nullable: true })
    clientSecret?: string;

    @Field({ nullable: true })
    qrCode?: string;

    @Field({ nullable: true })
    transactionId?: string;

    @Field({ nullable: true })
    status?: string;

    @Field({ nullable: true })
    errorMessage?: string;
}

@ObjectType()
export class RefundResult {
    @Field(() => ID)
    id: string;

    @Field()
    amount: number;

    @Field()
    currency: string;

    @Field()
    status: string;

    @Field({ nullable: true })
    reason?: string;
}
