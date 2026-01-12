import { Module, Global } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { join } from 'path';
import { RoleGrpcClient } from './role.grpc.client';
import { UserGrpcClient } from './user.grpc.client';

/**
 * gRPC Clients Module
 * Provides gRPC clients for internal service communication
 */
@Global()
@Module({
    imports: [
        ClientsModule.registerAsync([
            {
                name: 'CORE_GRPC_PACKAGE',
                imports: [ConfigModule],
                inject: [ConfigService],
                useFactory: (configService: ConfigService) => ({
                    transport: Transport.GRPC,
                    options: {
                        package: ['role', 'user'],
                        protoPath: [
                            join(__dirname, '../../../../proto/role.proto'),
                            join(__dirname, '../../../../proto/user.proto'),
                        ],
                        url: configService.get<string>('CORE_GRPC_URL') || 'localhost:50061',
                        loader: {
                            keepCase: true,
                            longs: String,
                            enums: String,
                            defaults: true,
                            oneofs: true,
                        },
                        maxReceiveMessageLength: 1024 * 1024 * 10, // 10MB
                        maxSendMessageLength: 1024 * 1024 * 10, // 10MB
                    },
                }),
            },
        ]),
    ],
    providers: [RoleGrpcClient, UserGrpcClient],
    exports: [ClientsModule, RoleGrpcClient, UserGrpcClient],
})
export class GrpcClientsModule { }
