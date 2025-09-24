import { Module } from '@nestjs/common';
import { PluginManagementResolver } from './plugin-management.resolver';
import { PluginManagementService } from './plugin-management.service';
import { WebhookService } from './webhook.service';

@Module({
  providers: [PluginManagementResolver, PluginManagementService, WebhookService],
  exports: [PluginManagementService, WebhookService],
})
export class PluginManagementModule {}