import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentProviderInterface } from './payment-provider.interface';
import { StripeProvider } from './stripe/stripe.provider';
import { PayPalProvider } from './paypal/paypal.provider';
import { SepayProvider } from './sepay/sepay.provider';

/**
 * Provider Registry
 * Maps provider names to their implementations
 */
export const PROVIDER_REGISTRY = {
    STRIPE: StripeProvider,
    PAYPAL: PayPalProvider,
    SEPAY: SepayProvider,
} as const;

export type ProviderName = keyof typeof PROVIDER_REGISTRY;

/**
 * Payment Provider Factory
 * Creates and manages payment provider instances
 */
@Injectable()
export class PaymentProviderFactory implements OnModuleInit {
    private readonly logger = new Logger(PaymentProviderFactory.name);
    private providers = new Map<string, PaymentProviderInterface>();
    private defaultProvider: string;

    constructor(
        private readonly configService: ConfigService,
        private readonly stripeProvider: StripeProvider,
        private readonly paypalProvider: PayPalProvider,
        private readonly sepayProvider: SepayProvider,
    ) {
        this.defaultProvider =
            this.configService.get('DEFAULT_PAYMENT_PROVIDER') || 'STRIPE';
    }

    async onModuleInit() {
        // Register all available providers
        this.registerProvider('STRIPE', this.stripeProvider);
        this.registerProvider('PAYPAL', this.paypalProvider);
        this.registerProvider('SEPAY', this.sepayProvider);

        this.logger.log(
            `Registered ${this.providers.size} payment providers. Default: ${this.defaultProvider}`,
        );
    }

    /**
     * Register a provider instance
     */
    private registerProvider(name: string, provider: PaymentProviderInterface) {
        if (provider.isConfigured()) {
            this.providers.set(name.toUpperCase(), provider);
            this.logger.log(`Registered provider: ${name}`);
        } else {
            this.logger.warn(`Provider ${name} is not configured, skipping`);
        }
    }

    /**
     * Get provider by name
     */
    getProvider(name?: string): PaymentProviderInterface {
        const providerName = (name || this.defaultProvider).toUpperCase();
        const provider = this.providers.get(providerName);

        if (!provider) {
            throw new Error(
                `Payment provider '${providerName}' is not available. ` +
                `Available providers: ${this.getAvailableProviders().join(', ')}`,
            );
        }

        return provider;
    }

    /**
     * Get the default provider
     */
    getDefaultProvider(): PaymentProviderInterface {
        return this.getProvider(this.defaultProvider);
    }

    /**
     * List all available (configured) providers
     */
    getAvailableProviders(): string[] {
        return Array.from(this.providers.keys());
    }

    /**
     * Check if a provider is available
     */
    isProviderAvailable(name: string): boolean {
        return this.providers.has(name.toUpperCase());
    }

    /**
     * Get provider for webhook path
     */
    getProviderByWebhookPath(path: string): PaymentProviderInterface | null {
        for (const provider of this.providers.values()) {
            if (provider.getWebhookPath() === path) {
                return provider;
            }
        }
        return null;
    }
}
