import { Global, Injectable, Logger, Module, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

// =============================================================================
// RedisService (कॅशिंग आणि हाय-स्पीड डेटा साठवण्यासाठी)
//
// काय करतो:
// 1. Redis शी कनेक्ट करतो (जर चालू असेल तर).
// 2. GET, SET (TTL सह), DEL ऑपरेशन्स करतो.
// 3. जर Redis चालू नसेल (Offline/No Server), तरीही ॲप क्रॅश न होता सुरक्षित फॉलबॅक देतो!
// =============================================================================

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;
  private isConnected = false;

  constructor(private readonly configService: ConfigService) {
    const redisHost = this.configService.get<string>('REDIS_HOST', '127.0.0.1');
    const redisPort = Number(this.configService.get<number>('REDIS_PORT', 6379));

    try {
      this.client = new Redis({
        host: redisHost,
        port: redisPort,
        maxRetriesPerRequest: 1,
        lazyConnect: true,
        connectTimeout: 2000,
        retryStrategy: () => null, // लूप न मारता गप्प राहणे
      });

      this.client
        .connect()
        .then(() => {
          this.isConnected = true;
          this.logger.log(`✅ Redis शी कनेक्ट झाले: ${redisHost}:${redisPort}`);
        })
        .catch(() => {
          this.isConnected = false;
          this.logger.warn(
            `⚠️ Redis सर्व्हर चालू नाही (${redisHost}:${redisPort}). डेटा थेट MongoDB वरून हाताळला जाईल.`,
          );
        });

      this.client.on('error', () => {
        this.isConnected = false;
      });
    } catch {
      this.isConnected = false;
    }
  }

  // 1. कॅशमधून डेटा मिळवणे
  async get<T>(key: string): Promise<T | null> {
    if (!this.isConnected || !this.client) return null;
    try {
      const data = await this.client.get(key);
      return data ? (JSON.parse(data) as T) : null;
    } catch {
      return null;
    }
  }

  // 2. कॅशमध्ये डेटा सेव्ह करणे (TTL सेकंदांसह)
  async set(key: string, value: unknown, ttlSeconds = 300): Promise<void> {
    if (!this.isConnected || !this.client) return;
    try {
      const stringified = JSON.stringify(value);
      if (ttlSeconds > 0) {
        await this.client.set(key, stringified, 'EX', ttlSeconds);
      } else {
        await this.client.set(key, stringified);
      }
    } catch {
      // ignore
    }
  }

  // 3. कॅश की डिलीट करणे
  async del(key: string): Promise<void> {
    if (!this.isConnected || !this.client) return;
    try {
      await this.client.del(key);
    } catch {
      // ignore
    }
  }

  // 4. पॅटर्ननुसार की डिलीट करणे
  async invalidatePattern(pattern: string): Promise<void> {
    if (!this.isConnected || !this.client) return;
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(...keys);
      }
    } catch {
      // ignore
    }
  }

  getStatus(): boolean {
    return this.isConnected;
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit().catch(() => null);
    }
  }
}

@Global()
@Module({
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
