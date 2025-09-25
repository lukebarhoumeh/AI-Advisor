import Redis from 'ioredis';
import { logger } from '../utils/logger';

class CacheService {
  private redis: Redis | null = null;
  private isConnected = false;

  constructor() {
    this.connect();
  }

  /**
   * Connect to Redis
   */
  private connect() {
    try {
      this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
        maxRetriesPerRequest: 3,
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
      });

      this.redis.on('connect', () => {
        this.isConnected = true;
        logger.info('Redis connected');
      });

      this.redis.on('error', (error) => {
        logger.error('Redis error:', error);
        this.isConnected = false;
      });

      this.redis.on('close', () => {
        this.isConnected = false;
        logger.warn('Redis connection closed');
      });
    } catch (error) {
      logger.error('Failed to initialize Redis:', error);
    }
  }

  /**
   * Get value from cache
   */
  async get(key: string): Promise<string | null> {
    if (!this.isConnected || !this.redis) {
      logger.warn('Cache miss - Redis not connected');
      return null;
    }

    try {
      return await this.redis.get(key);
    } catch (error) {
      logger.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * Set value in cache
   */
  async set(key: string, value: string, ttl?: number): Promise<boolean> {
    if (!this.isConnected || !this.redis) {
      logger.warn('Cache set skipped - Redis not connected');
      return false;
    }

    try {
      if (ttl) {
        await this.redis.set(key, value, 'EX', ttl);
      } else {
        await this.redis.set(key, value);
      }
      return true;
    } catch (error) {
      logger.error('Cache set error:', error);
      return false;
    }
  }

  /**
   * Delete value from cache
   */
  async del(key: string): Promise<boolean> {
    if (!this.isConnected || !this.redis) {
      return false;
    }

    try {
      await this.redis.del(key);
      return true;
    } catch (error) {
      logger.error('Cache delete error:', error);
      return false;
    }
  }

  /**
   * Clear all cache entries with pattern
   */
  async clearPattern(pattern: string): Promise<boolean> {
    if (!this.isConnected || !this.redis) {
      return false;
    }

    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
      return true;
    } catch (error) {
      logger.error('Cache clear pattern error:', error);
      return false;
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    if (!this.isConnected || !this.redis) {
      return false;
    }

    try {
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Cache exists error:', error);
      return false;
    }
  }

  /**
   * Set value with expiration if not exists
   */
  async setNX(key: string, value: string, ttl: number): Promise<boolean> {
    if (!this.isConnected || !this.redis) {
      return false;
    }

    try {
      const result = await this.redis.set(key, value, 'EX', ttl, 'NX');
      return result === 'OK';
    } catch (error) {
      logger.error('Cache setNX error:', error);
      return false;
    }
  }

  /**
   * Increment counter
   */
  async incr(key: string, ttl?: number): Promise<number | null> {
    if (!this.isConnected || !this.redis) {
      return null;
    }

    try {
      const result = await this.redis.incr(key);
      if (ttl && result === 1) {
        await this.redis.expire(key, ttl);
      }
      return result;
    } catch (error) {
      logger.error('Cache incr error:', error);
      return null;
    }
  }

  /**
   * Get hash field
   */
  async hget(key: string, field: string): Promise<string | null> {
    if (!this.isConnected || !this.redis) {
      return null;
    }

    try {
      return await this.redis.hget(key, field);
    } catch (error) {
      logger.error('Cache hget error:', error);
      return null;
    }
  }

  /**
   * Set hash field
   */
  async hset(key: string, field: string, value: string): Promise<boolean> {
    if (!this.isConnected || !this.redis) {
      return false;
    }

    try {
      await this.redis.hset(key, field, value);
      return true;
    } catch (error) {
      logger.error('Cache hset error:', error);
      return false;
    }
  }

  /**
   * Disconnect from Redis
   */
  async disconnect() {
    if (this.redis) {
      await this.redis.quit();
      this.isConnected = false;
    }
  }
}

export const cacheService = new CacheService();
