import { Injectable, Logger } from '@nestjs/common';
import { LoggerService } from '@anineplus/common';
import chalk from 'chalk';
import figlet from 'figlet';
import { GatewayCacheService } from './gateway-cache.service';
import { GatewayUrlResolver } from '../resolvers/gateway-url-resolver';

@Injectable()
export class StartupDisplayService {
  private readonly logger = new Logger(StartupDisplayService.name);

  constructor(
    private readonly urlResolver: GatewayUrlResolver,
    private readonly cacheService: GatewayCacheService,
    private readonly loggerService: LoggerService,
  ) {}

  /**
   * Display comprehensive startup information
   */
  displayStartupInfo(): void {
    this.displayAsciiArt();
    this.displayEndpoints();
    this.displayConfiguration();
  }

  /**
   * Display ASCII art banner
   */
  private displayAsciiArt(): void {
    const ninePlusCmsArt = figlet.textSync('NinePlus CMS', {
      font: 'Slant',
      horizontalLayout: 'default',
      verticalLayout: 'default',
    });

    console.log(chalk.blueBright(ninePlusCmsArt));
    console.log(chalk.greenBright('by devhoangkien'));
    console.log(''); // Empty line for spacing
  }

  /**
   * Display all available endpoints
   */
  private displayEndpoints(): void {
    const baseUrl = this.urlResolver.getBaseUrl();
    
    this.loggerService.log(`✅ Application is running on: ${chalk.redBright(baseUrl)}`);
    this.loggerService.log(`🔗 GraphQL endpoint: ${chalk.yellowBright(`${baseUrl}/graphql`)}`);
    this.loggerService.log(`🔗 REST API endpoint: ${chalk.cyanBright(`${baseUrl}/api`)}`);
    this.loggerService.log(`📖 Swagger UI: ${chalk.greenBright(`${baseUrl}/api/swagger`)}`);
  }

  /**
   * Display configuration information
   */
  private displayConfiguration(): void {
    const cacheStats = this.cacheService.getStats();
    
    this.loggerService.log('');
    this.loggerService.log('🔧 Configuration:');
    this.loggerService.log(`   Host: ${chalk.cyan(this.urlResolver.getHost())}`);
    this.loggerService.log(`   Port: ${chalk.cyan(this.urlResolver.getPort().toString())}`);
    this.loggerService.log(`   Protocol: ${chalk.cyan(this.urlResolver.getProtocol())}`);
    this.loggerService.log(`   Cache Max Size: ${chalk.yellow(cacheStats.maxSize.toString())}`);
    this.loggerService.log(`   Cache TTL: ${chalk.yellow((cacheStats.ttl / 1000 / 60).toString())} minutes`);
  }

  /**
   * Display subgraph loading information
   */
  displaySubgraphInfo(subgraphs: Array<{ name: string; url: string }>): void {
    console.log(
      '🚀 Loaded subgraphs:',
      subgraphs.map((sg) => `${sg.name} (${sg.url})`).join(', '),
    );

    console.log(
      '🚀 Loaded federated schema from subgraphs:',
      subgraphs.map((sg) => sg.name).join(', '),
    );
  }
}