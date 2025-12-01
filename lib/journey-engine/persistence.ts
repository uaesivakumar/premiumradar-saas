/**
 * Journey Engine Persistence
 * Sprint S48: Journey State Persistence
 *
 * State storage and recovery:
 * - Checkpoint management
 * - Instance storage
 * - State recovery
 */
import type {
  JourneyInstance,
  ExecutionContext,
  ExecutionStatus,
  PersistenceAdapter,
} from './types';

// =============================================================================
// IN-MEMORY ADAPTER (for development/testing)
// =============================================================================

export class InMemoryPersistenceAdapter implements PersistenceAdapter {
  private instances: Map<string, JourneyInstance> = new Map();
  private checkpoints: Map<string, ExecutionContext> = new Map();

  async saveInstance(instance: JourneyInstance): Promise<void> {
    this.instances.set(instance.id, { ...instance });
  }

  async loadInstance(instanceId: string): Promise<JourneyInstance | null> {
    const instance = this.instances.get(instanceId);
    return instance ? { ...instance } : null;
  }

  async updateInstance(
    instanceId: string,
    updates: Partial<JourneyInstance>
  ): Promise<void> {
    const instance = this.instances.get(instanceId);
    if (instance) {
      this.instances.set(instanceId, { ...instance, ...updates });
    }
  }

  async deleteInstance(instanceId: string): Promise<void> {
    this.instances.delete(instanceId);
    this.checkpoints.delete(instanceId);
  }

  async listInstances(filters?: {
    journeyId?: string;
    tenantId?: string;
    status?: ExecutionStatus;
    limit?: number;
    offset?: number;
  }): Promise<JourneyInstance[]> {
    let results = Array.from(this.instances.values());

    if (filters?.journeyId) {
      results = results.filter((i) => i.journeyId === filters.journeyId);
    }
    if (filters?.tenantId) {
      results = results.filter((i) => i.tenantId === filters.tenantId);
    }
    if (filters?.status) {
      results = results.filter((i) => i.context.status === filters.status);
    }

    const offset = filters?.offset ?? 0;
    const limit = filters?.limit ?? 100;
    return results.slice(offset, offset + limit);
  }

  async saveCheckpoint(instanceId: string, context: ExecutionContext): Promise<void> {
    this.checkpoints.set(instanceId, { ...context });
  }

  async loadCheckpoint(instanceId: string): Promise<ExecutionContext | null> {
    const checkpoint = this.checkpoints.get(instanceId);
    return checkpoint ? { ...checkpoint } : null;
  }

  // Test helpers
  clear(): void {
    this.instances.clear();
    this.checkpoints.clear();
  }

  getInstanceCount(): number {
    return this.instances.size;
  }

  getCheckpointCount(): number {
    return this.checkpoints.size;
  }
}

// =============================================================================
// DATABASE ADAPTER
// =============================================================================

export interface DatabaseAdapterOptions {
  tableName?: string;
  checkpointTableName?: string;
  connectionPool?: unknown; // Database connection pool
}

/**
 * Database persistence adapter (PostgreSQL/Prisma compatible)
 */
export class DatabasePersistenceAdapter implements PersistenceAdapter {
  private tableName: string;
  private checkpointTableName: string;
  private db: unknown;

  constructor(db: unknown, options: DatabaseAdapterOptions = {}) {
    this.db = db;
    this.tableName = options.tableName ?? 'journey_instances';
    this.checkpointTableName = options.checkpointTableName ?? 'journey_checkpoints';
  }

  async saveInstance(instance: JourneyInstance): Promise<void> {
    // This would use Prisma or raw SQL
    // Example with Prisma:
    // await this.db.journeyInstance.upsert({
    //   where: { id: instance.id },
    //   create: instance,
    //   update: instance,
    // });

    // For now, throw to indicate not implemented
    throw new Error(
      'Database adapter requires Prisma or database client. Use InMemoryPersistenceAdapter for development.'
    );
  }

  async loadInstance(instanceId: string): Promise<JourneyInstance | null> {
    throw new Error(
      'Database adapter requires Prisma or database client. Use InMemoryPersistenceAdapter for development.'
    );
  }

  async updateInstance(
    instanceId: string,
    updates: Partial<JourneyInstance>
  ): Promise<void> {
    throw new Error(
      'Database adapter requires Prisma or database client. Use InMemoryPersistenceAdapter for development.'
    );
  }

  async deleteInstance(instanceId: string): Promise<void> {
    throw new Error(
      'Database adapter requires Prisma or database client. Use InMemoryPersistenceAdapter for development.'
    );
  }

  async listInstances(filters?: {
    journeyId?: string;
    tenantId?: string;
    status?: ExecutionStatus;
    limit?: number;
    offset?: number;
  }): Promise<JourneyInstance[]> {
    throw new Error(
      'Database adapter requires Prisma or database client. Use InMemoryPersistenceAdapter for development.'
    );
  }

  async saveCheckpoint(instanceId: string, context: ExecutionContext): Promise<void> {
    throw new Error(
      'Database adapter requires Prisma or database client. Use InMemoryPersistenceAdapter for development.'
    );
  }

  async loadCheckpoint(instanceId: string): Promise<ExecutionContext | null> {
    throw new Error(
      'Database adapter requires Prisma or database client. Use InMemoryPersistenceAdapter for development.'
    );
  }
}

// =============================================================================
// PRISMA ADAPTER
// =============================================================================

/**
 * Prisma-specific persistence adapter
 */
export function createPrismaPersistenceAdapter(prisma: unknown): PersistenceAdapter {
  // Type-safe Prisma client interface
  interface PrismaClient {
    journeyInstance: {
      upsert: (args: unknown) => Promise<unknown>;
      findUnique: (args: unknown) => Promise<unknown>;
      update: (args: unknown) => Promise<unknown>;
      delete: (args: unknown) => Promise<unknown>;
      findMany: (args: unknown) => Promise<unknown[]>;
    };
    journeyCheckpoint: {
      upsert: (args: unknown) => Promise<unknown>;
      findUnique: (args: unknown) => Promise<unknown>;
    };
  }

  const db = prisma as PrismaClient;

  return {
    async saveInstance(instance: JourneyInstance): Promise<void> {
      await db.journeyInstance.upsert({
        where: { id: instance.id },
        create: {
          id: instance.id,
          journeyId: instance.journeyId,
          journeyName: instance.journeyName,
          journeyVersion: instance.journeyVersion,
          context: JSON.stringify(instance.context),
          history: JSON.stringify(instance.history),
          metrics: instance.metrics ? JSON.stringify(instance.metrics) : null,
          tenantId: instance.tenantId,
          workspaceId: instance.workspaceId,
          createdAt: instance.createdAt,
          updatedAt: instance.updatedAt,
        },
        update: {
          context: JSON.stringify(instance.context),
          history: JSON.stringify(instance.history),
          metrics: instance.metrics ? JSON.stringify(instance.metrics) : null,
          updatedAt: new Date(),
        },
      });
    },

    async loadInstance(instanceId: string): Promise<JourneyInstance | null> {
      const result = (await db.journeyInstance.findUnique({
        where: { id: instanceId },
      })) as {
        id: string;
        journeyId: string;
        journeyName: string;
        journeyVersion: number;
        context: string;
        history: string;
        metrics: string | null;
        tenantId: string;
        workspaceId: string | null;
        createdAt: Date;
        updatedAt: Date;
      } | null;

      if (!result) return null;

      return {
        id: result.id,
        journeyId: result.journeyId,
        journeyName: result.journeyName,
        journeyVersion: result.journeyVersion,
        context: JSON.parse(result.context),
        history: JSON.parse(result.history),
        metrics: result.metrics ? JSON.parse(result.metrics) : undefined,
        tenantId: result.tenantId,
        workspaceId: result.workspaceId ?? undefined,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
      };
    },

    async updateInstance(
      instanceId: string,
      updates: Partial<JourneyInstance>
    ): Promise<void> {
      const data: Record<string, unknown> = { updatedAt: new Date() };
      if (updates.context) data.context = JSON.stringify(updates.context);
      if (updates.history) data.history = JSON.stringify(updates.history);
      if (updates.metrics) data.metrics = JSON.stringify(updates.metrics);

      await db.journeyInstance.update({
        where: { id: instanceId },
        data,
      });
    },

    async deleteInstance(instanceId: string): Promise<void> {
      await db.journeyInstance.delete({
        where: { id: instanceId },
      });
    },

    async listInstances(filters?: {
      journeyId?: string;
      tenantId?: string;
      status?: ExecutionStatus;
      limit?: number;
      offset?: number;
    }): Promise<JourneyInstance[]> {
      const where: Record<string, unknown> = {};
      if (filters?.journeyId) where.journeyId = filters.journeyId;
      if (filters?.tenantId) where.tenantId = filters.tenantId;

      const results = (await db.journeyInstance.findMany({
        where,
        take: filters?.limit ?? 100,
        skip: filters?.offset ?? 0,
        orderBy: { createdAt: 'desc' },
      })) as Array<{
        id: string;
        journeyId: string;
        journeyName: string;
        journeyVersion: number;
        context: string;
        history: string;
        metrics: string | null;
        tenantId: string;
        workspaceId: string | null;
        createdAt: Date;
        updatedAt: Date;
      }>;

      const instances = results.map((r) => ({
        id: r.id,
        journeyId: r.journeyId,
        journeyName: r.journeyName,
        journeyVersion: r.journeyVersion,
        context: JSON.parse(r.context) as ExecutionContext,
        history: JSON.parse(r.history),
        metrics: r.metrics ? JSON.parse(r.metrics) : undefined,
        tenantId: r.tenantId,
        workspaceId: r.workspaceId ?? undefined,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      }));

      // Filter by status if needed (after parsing context)
      if (filters?.status) {
        return instances.filter((i) => i.context.status === filters.status);
      }

      return instances;
    },

    async saveCheckpoint(instanceId: string, context: ExecutionContext): Promise<void> {
      await db.journeyCheckpoint.upsert({
        where: { instanceId },
        create: {
          instanceId,
          context: JSON.stringify(context),
          createdAt: new Date(),
        },
        update: {
          context: JSON.stringify(context),
          updatedAt: new Date(),
        },
      });
    },

    async loadCheckpoint(instanceId: string): Promise<ExecutionContext | null> {
      const result = (await db.journeyCheckpoint.findUnique({
        where: { instanceId },
      })) as { context: string } | null;

      if (!result) return null;
      return JSON.parse(result.context);
    },
  };
}

// =============================================================================
// PERSISTENCE MANAGER
// =============================================================================

/**
 * High-level persistence manager
 */
export class PersistenceManager {
  private adapter: PersistenceAdapter;
  private autoSaveInterval: number;
  private autoSaveTimer: ReturnType<typeof setInterval> | null = null;

  constructor(adapter: PersistenceAdapter, autoSaveIntervalMs: number = 5000) {
    this.adapter = adapter;
    this.autoSaveInterval = autoSaveIntervalMs;
  }

  /**
   * Start auto-saving checkpoints
   */
  startAutoSave(instanceId: string, getContext: () => ExecutionContext): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
    }

    this.autoSaveTimer = setInterval(async () => {
      try {
        const context = getContext();
        await this.adapter.saveCheckpoint(instanceId, context);
      } catch (error) {
        console.error('Auto-save checkpoint failed:', error);
      }
    }, this.autoSaveInterval);
  }

  /**
   * Stop auto-saving
   */
  stopAutoSave(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
  }

  /**
   * Create a new instance record
   */
  async createInstance(instance: JourneyInstance): Promise<void> {
    await this.adapter.saveInstance(instance);
  }

  /**
   * Update instance with current context
   */
  async updateInstance(instance: JourneyInstance): Promise<void> {
    await this.adapter.updateInstance(instance.id, {
      context: instance.context,
      history: instance.history,
      metrics: instance.metrics,
      updatedAt: new Date(),
    });
  }

  /**
   * Load instance by ID
   */
  async loadInstance(instanceId: string): Promise<JourneyInstance | null> {
    return this.adapter.loadInstance(instanceId);
  }

  /**
   * Recover from checkpoint
   */
  async recoverFromCheckpoint(instanceId: string): Promise<ExecutionContext | null> {
    return this.adapter.loadCheckpoint(instanceId);
  }

  /**
   * List instances with filters
   */
  async listInstances(filters?: {
    journeyId?: string;
    tenantId?: string;
    status?: ExecutionStatus;
    limit?: number;
    offset?: number;
  }): Promise<JourneyInstance[]> {
    return this.adapter.listInstances(filters);
  }

  /**
   * Delete instance and checkpoint
   */
  async deleteInstance(instanceId: string): Promise<void> {
    await this.adapter.deleteInstance(instanceId);
  }

  /**
   * Get the underlying adapter
   */
  getAdapter(): PersistenceAdapter {
    return this.adapter;
  }
}

// =============================================================================
// FACTORY
// =============================================================================

/**
 * Create persistence manager with in-memory adapter
 */
export function createInMemoryPersistence(): PersistenceManager {
  return new PersistenceManager(new InMemoryPersistenceAdapter());
}

/**
 * Create persistence manager with Prisma adapter
 */
export function createPrismaPersistence(prisma: unknown): PersistenceManager {
  return new PersistenceManager(createPrismaPersistenceAdapter(prisma));
}
