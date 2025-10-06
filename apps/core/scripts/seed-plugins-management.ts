import { PrismaService } from 'src/prisma/prisma.service';
import { WebhookService } from '../src/plugin-management/webhook.service';
import { ConfigService } from '@nestjs/config';
import { PluginManagementService } from 'src/plugin-management/plugin-management.service';

// This script seeds the service registry with initial services
async function seedPluginsManagement() {
  const configService = new ConfigService();
  const prisma = new PrismaService();
  const webhookService = new WebhookService(configService);
  const pluginsManagement = new PluginManagementService(prisma, webhookService);

  console.log('🌱 Seeding service registry...');

  try {
    // Always register core-service as the primary service
    const coreService = await pluginsManagement.register({
      name: 'core-service',
      displayName: 'Core Service',
      description: 'Core authentication and user management service',
      url: process.env.CORE_SERVICE_URL || 'http://localhost:3001/graphql',
      version: '1.0.0',
      status: 'ACTIVE',
      isRequired: true,
      tags: ['core', 'auth', 'users'],
      dependencies: [],
    });

    console.log('✅ Core service registered:', coreService.name);

    // Register payment service if available
    if (process.env.PAYMENT_SERVICE_URL) {
      const paymentService = await pluginsManagement.register({
        name: 'payment-service',
        displayName: 'Payment Service',
        description: 'Payment and subscription management service',
        url: process.env.PAYMENT_SERVICE_URL,
        version: '1.0.0',
        status: 'ACTIVE',
        isRequired: false,
        tags: ['payment', 'subscription'],
        dependencies: ['core-service'],
      });

      console.log('✅ Payment service registered:', paymentService.name);
    }

    // Register other services from environment variables
    // Format: SERVICE_NAME_URL for each service
    const envVars = process.env;
    const serviceUrls = Object.keys(envVars)
      .filter(key => key.endsWith('_SERVICE_URL') && key !== 'CORE_SERVICE_URL' && key !== 'PAYMENT_SERVICE_URL')
      .map(key => ({
        name: key.replace('_SERVICE_URL', '').toLowerCase().replace('_', '-'),
        url: envVars[key],
      }));

    for (const { name, url } of serviceUrls) {
      try {
        const service = await pluginsManagement.register({
          name: name,
          displayName: name.charAt(0).toUpperCase() + name.slice(1).replace('-', ' ') + ' Service',
          description: `${name} service`,
          url: url!,
          version: '1.0.0',
          status: 'ACTIVE',
          isRequired: false,
          tags: [name],
          dependencies: ['core-service'],
        });

        console.log('✅ Service registered:', service.name);
      } catch (error) {
        console.warn(`⚠️  Failed to register ${name}:`, error.message);
      }
    }

    console.log('🎉 Service registry seeding completed!');

  } catch (error) {
    console.error('❌ Service registry seeding failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding if this file is executed directly
if (require.main === module) {
  seedPluginsManagement()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { seedPluginsManagement };