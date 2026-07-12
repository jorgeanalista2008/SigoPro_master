import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { tenantLocalStorage } from '../common/tenant-context/tenant-store';

function modelHasField(model: string, field: string): boolean {
  const modelsWithTenant = ['User', 'Role', 'Company', 'UsageLog', 'AccountingAccount', 'JournalEntry', 'TaxDocument', 'AuditLog'];
  const modelsWithCompany = ['AccountingAccount', 'JournalEntry', 'TaxDocument'];
  
  if (field === 'tenantId') return modelsWithTenant.includes(model);
  if (field === 'companyId') return modelsWithCompany.includes(model);
  return false;
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private static pool: Pool;
  private static adapter: PrismaPg;
  public static instance: PrismaService;

  constructor() {
    const connectionString = process.env.DATABASE_URL;
    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    
    super({ adapter });
    
    PrismaService.pool = pool;
    PrismaService.adapter = adapter;
    PrismaService.instance = this;
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
    await PrismaService.pool.end();
  }

  // Cliente extendido que filtra automáticamente por tenant y empresa
  get tenantClient(): any {
    const store = tenantLocalStorage.getStore();
    
    if (!store || store.isSuperAdmin) {
      return this;
    }

    const { tenantId, companyId } = store;

    return this.$extends({
      query: {
        $allModels: {
          async findMany({ model, args, query }) {
            args.where = args.where || {};
            if (modelHasField(model, 'tenantId')) {
              (args.where as any).tenantId = tenantId;
            }
            if (companyId && modelHasField(model, 'companyId')) {
              (args.where as any).companyId = companyId;
            }
            return query(args);
          },
          async findFirst({ model, args, query }) {
            args.where = args.where || {};
            if (modelHasField(model, 'tenantId')) {
              (args.where as any).tenantId = tenantId;
            }
            if (companyId && modelHasField(model, 'companyId')) {
              (args.where as any).companyId = companyId;
            }
            return query(args);
          },
          async findUnique({ model, args }) {
            const whereClause: any = { ...args.where };
            if (modelHasField(model, 'tenantId')) {
              whereClause.tenantId = tenantId;
            }
            if (companyId && modelHasField(model, 'companyId')) {
              whereClause.companyId = companyId;
            }
            return (PrismaService.instance as any)[model].findFirst({
              ...args,
              where: whereClause,
            });
          },
          async findUniqueOrThrow({ model, args }) {
            const whereClause: any = { ...args.where };
            if (modelHasField(model, 'tenantId')) {
              whereClause.tenantId = tenantId;
            }
            if (companyId && modelHasField(model, 'companyId')) {
              whereClause.companyId = companyId;
            }
            return (PrismaService.instance as any)[model].findFirstOrThrow({
              ...args,
              where: whereClause,
            });
          },
          async create({ model, args, query }) {
            args.data = args.data || {};
            if (modelHasField(model, 'tenantId')) {
              (args.data as any).tenantId = tenantId;
            }
            if (companyId && modelHasField(model, 'companyId')) {
              (args.data as any).companyId = companyId;
            }
            return query(args);
          },
          async createMany({ model, args, query }) {
            if (args.data) {
              const dataArray = Array.isArray(args.data) ? args.data : [args.data];
              for (const item of dataArray) {
                if (modelHasField(model, 'tenantId')) {
                  (item as any).tenantId = tenantId;
                }
                if (companyId && modelHasField(model, 'companyId')) {
                  (item as any).companyId = companyId;
                }
              }
            }
            return query(args);
          },
          async update({ model, args, query }) {
            args.where = args.where || {};
            if (modelHasField(model, 'tenantId')) {
              (args.where as any).tenantId = tenantId;
            }
            if (companyId && modelHasField(model, 'companyId')) {
              (args.where as any).companyId = companyId;
            }
            return query(args);
          },
          async updateMany({ model, args, query }) {
            args.where = args.where || {};
            if (modelHasField(model, 'tenantId')) {
              (args.where as any).tenantId = tenantId;
            }
            if (companyId && modelHasField(model, 'companyId')) {
              (args.where as any).companyId = companyId;
            }
            return query(args);
          },
          async delete({ model, args, query }) {
            args.where = args.where || {};
            if (modelHasField(model, 'tenantId')) {
              (args.where as any).tenantId = tenantId;
            }
            if (companyId && modelHasField(model, 'companyId')) {
              (args.where as any).companyId = companyId;
            }
            return query(args);
          },
          async deleteMany({ model, args, query }) {
            args.where = args.where || {};
            if (modelHasField(model, 'tenantId')) {
              (args.where as any).tenantId = tenantId;
            }
            if (companyId && modelHasField(model, 'companyId')) {
              (args.where as any).companyId = companyId;
            }
            return query(args);
          },
          async count({ model, args, query }) {
            args.where = args.where || {};
            if (modelHasField(model, 'tenantId')) {
              (args.where as any).tenantId = tenantId;
            }
            if (companyId && modelHasField(model, 'companyId')) {
              (args.where as any).companyId = companyId;
            }
            return query(args);
          },
          async upsert({ model, args, query }) {
            args.create = args.create || {};
            args.update = args.update || {};
            if (modelHasField(model, 'tenantId')) {
              (args.create as any).tenantId = tenantId;
              (args.update as any).tenantId = tenantId;
            }
            if (companyId && modelHasField(model, 'companyId')) {
              (args.create as any).companyId = companyId;
              (args.update as any).companyId = companyId;
            }
            return query(args);
          }
        }
      }
    });
  }
}

