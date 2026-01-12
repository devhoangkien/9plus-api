import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom, Observable } from 'rxjs';
import { timeout, retry } from 'rxjs/operators';

/**
 * User gRPC Service Interface
 */
interface UserServiceClient {
    GetUserById(data: { id: string }): Observable<User>;
    GetUserByEmail(data: { email: string }): Observable<User>;
    ValidateCredentials(data: { email: string; password: string }): Observable<{ valid: boolean; user: User }>;
}

/**
 * User Interface
 */
export interface User {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    status: string;
    email_verified: boolean;
    two_factor_enabled: boolean;
    created_at: string;
    updated_at: string;
}

/**
 * gRPC Client for User Service
 * Provides type-safe access to User service methods
 */
@Injectable()
export class UserGrpcClient implements OnModuleInit {
    private userService: UserServiceClient;
    private readonly TIMEOUT_MS = 5000;
    private readonly RETRY_COUNT = 2;

    constructor(
        @Inject('CORE_GRPC_PACKAGE') private readonly client: ClientGrpc,
    ) { }

    onModuleInit() {
        this.userService = this.client.getService<UserServiceClient>('UserService');
    }

    /**
     * Get user by ID
     * @param id User ID
     * @returns User object
     */
    async getUserById(id: string): Promise<User | null> {
        try {
            const user = await firstValueFrom(
                this.userService.GetUserById({ id }).pipe(
                    timeout(this.TIMEOUT_MS),
                    retry(this.RETRY_COUNT),
                ),
            );
            return user;
        } catch (error) {
            console.error('[UserGrpcClient] GetUserById error:', error);
            throw error;
        }
    }

    /**
     * Get user by email
     * @param email User email
     * @returns User object
     */
    async getUserByEmail(email: string): Promise<User | null> {
        try {
            const user = await firstValueFrom(
                this.userService.GetUserByEmail({ email }).pipe(
                    timeout(this.TIMEOUT_MS),
                    retry(this.RETRY_COUNT),
                ),
            );
            return user;
        } catch (error) {
            console.error('[UserGrpcClient] GetUserByEmail error:', error);
            throw error;
        }
    }

    /**
     * Validate user credentials
     * @param email User email
     * @param password User password
     * @returns Validation result with user
     */
    async validateCredentials(email: string, password: string): Promise<{ valid: boolean; user: User | null }> {
        try {
            const result = await firstValueFrom(
                this.userService.ValidateCredentials({ email, password }).pipe(
                    timeout(this.TIMEOUT_MS),
                    retry(this.RETRY_COUNT),
                ),
            );
            return result;
        } catch (error) {
            console.error('[UserGrpcClient] ValidateCredentials error:', error);
            throw error;
        }
    }
}
