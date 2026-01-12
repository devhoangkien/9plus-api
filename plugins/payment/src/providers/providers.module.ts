import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { StripeProvider } from './stripe/stripe.provider';
import { PayPalProvider } from './paypal/paypal.provider';
import { SepayProvider } from './sepay/sepay.provider';
import { PaymentProviderFactory } from './provider.factory';

@Global()
@Module({
    imports: [ConfigModule],
    providers: [
        StripeProvider,
        PayPalProvider,
        SepayProvider,
        PaymentProviderFactory,
    ],
    exports: [
        StripeProvider,
        PayPalProvider,
        SepayProvider,
        PaymentProviderFactory,
    ],
})
export class ProvidersModule { }
