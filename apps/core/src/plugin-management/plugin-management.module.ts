import { Module } from '@nestjs/common';
import { PluginsManagementResolver } from './plugin-management.resolver';
import { PluginsManagementService } from './plugin-management.service';
import { WebhookService } from './webhook.service';

@Module({
  providers: [PluginsManagementResolver, PluginsManagementService, WebhookService],
  exports: [PluginsManagementService, WebhookService],
})
export class PluginsManagementModule {}