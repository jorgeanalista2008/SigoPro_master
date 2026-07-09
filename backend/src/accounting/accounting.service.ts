import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAccountDto, AccountType } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';

@Injectable()
export class AccountingService {
  constructor(private prisma: PrismaService) {}

  // Helper to verify company ownership by tenant
  private async verifyCompany(companyId: string, tenantId: string) {
    const company = await this.prisma.company.findFirst({
      where: { id: companyId, tenantId },
    });
    if (!company) {
      throw new NotFoundException(
        `Empresa con ID ${companyId} no existe o no pertenece a tu cuenta.`,
      );
    }
    return company;
  }

  async create(companyId: string, createAccountDto: CreateAccountDto, tenantId: string) {
    await this.verifyCompany(companyId, tenantId);
    const { code, name, type, isTransactional, parentId } = createAccountDto;

    // 1. Check code uniqueness per company
    const existing = await this.prisma.accountingAccount.findUnique({
      where: {
        companyId_code: { companyId, code },
      },
    });
    if (existing) {
      throw new ConflictException(`Ya existe una cuenta con el código ${code} en esta empresa.`);
    }

    let level = 1;
    if (parentId) {
      // 2. Validate parent account
      const parent = await this.prisma.accountingAccount.findFirst({
        where: { id: parentId, companyId },
      });
      if (!parent) {
        throw new BadRequestException('La cuenta padre especificada no pertenece a esta empresa.');
      }

      // If parent was transactional, automatically convert it to group account
      if (parent.isTransactional) {
        await this.prisma.accountingAccount.update({
          where: { id: parentId },
          data: { isTransactional: false },
        });
      }

      level = parent.level + 1;
    }

    return this.prisma.accountingAccount.create({
      data: {
        code,
        name,
        type,
        level,
        isTransactional: isTransactional !== undefined ? isTransactional : true,
        parentId,
        companyId,
        tenantId,
      },
    });
  }

  async findAll(companyId: string, tenantId: string, format: 'list' | 'tree' = 'list') {
    await this.verifyCompany(companyId, tenantId);

    const accounts = await this.prisma.accountingAccount.findMany({
      where: { companyId },
      orderBy: { code: 'asc' },
    });

    if (format === 'tree') {
      return this.buildTree(accounts);
    }

    return accounts;
  }

  async findOne(id: string, companyId: string, tenantId: string) {
    await this.verifyCompany(companyId, tenantId);

    const account = await this.prisma.accountingAccount.findFirst({
      where: { id, companyId },
    });

    if (!account) {
      throw new NotFoundException(`Cuenta contable con ID ${id} no encontrada.`);
    }

    return account;
  }

  async update(
    id: string,
    companyId: string,
    updateAccountDto: UpdateAccountDto,
    tenantId: string,
  ) {
    await this.verifyCompany(companyId, tenantId);

    // Verify account exists
    const account = await this.findOne(id, companyId, tenantId);

    const data: any = {};
    if (updateAccountDto.name) data.name = updateAccountDto.name;
    if (updateAccountDto.isTransactional !== undefined) {
      data.isTransactional = updateAccountDto.isTransactional;
    }

    if (updateAccountDto.parentId !== undefined) {
      if (updateAccountDto.parentId === id) {
        throw new BadRequestException('Una cuenta no puede ser su propio padre.');
      }

      if (updateAccountDto.parentId === null) {
        data.parentId = null;
        data.level = 1;
      } else {
        const parent = await this.prisma.accountingAccount.findFirst({
          where: { id: updateAccountDto.parentId, companyId },
        });
        if (!parent) {
          throw new BadRequestException('La cuenta padre especificada no existe en esta empresa.');
        }

        // Parent must not be transactional
        if (parent.isTransactional) {
          await this.prisma.accountingAccount.update({
            where: { id: parent.id },
            data: { isTransactional: false },
          });
        }

        data.parentId = updateAccountDto.parentId;
        data.level = parent.level + 1;
      }
    }

    return this.prisma.accountingAccount.update({
      where: { id },
      data,
    });
  }

  async remove(id: string, companyId: string, tenantId: string) {
    await this.verifyCompany(companyId, tenantId);
    await this.findOne(id, companyId, tenantId);

    // Check if account has children
    const childCount = await this.prisma.accountingAccount.count({
      where: { parentId: id },
    });
    if (childCount > 0) {
      throw new BadRequestException(
        'No se puede eliminar esta cuenta porque posee sub-cuentas asociadas.',
      );
    }

    await this.prisma.accountingAccount.delete({
      where: { id },
    });

    return { message: `Cuenta contable con ID ${id} eliminada con éxito.` };
  }

  // Import VEN-NIF compliant template
  async importTemplate(companyId: string, tenantId: string) {
    await this.verifyCompany(companyId, tenantId);

    // 1. Delete existing accounts to prevent unique constraint failures
    await this.prisma.accountingAccount.deleteMany({
      where: { companyId },
    });

    // Define standard Venezuelan Chart of Accounts
    const template = [
      // 1. ACTIVOS
      { code: '1', name: 'Activo', type: AccountType.ACTIVO, isTransactional: false },
      { code: '1.1', name: 'Activo Corriente', type: AccountType.ACTIVO, isTransactional: false },
      { code: '1.1.01', name: 'Efectivo y Equivalentes de Efectivo', type: AccountType.ACTIVO, isTransactional: false },
      { code: '1.1.01.01', name: 'Caja', type: AccountType.ACTIVO, isTransactional: false },
      { code: '1.1.01.01.001', name: 'Caja General', type: AccountType.ACTIVO, isTransactional: true },
      { code: '1.1.01.01.002', name: 'Caja Chica', type: AccountType.ACTIVO, isTransactional: true },
      { code: '1.1.01.02', name: 'Bancos', type: AccountType.ACTIVO, isTransactional: false },
      { code: '1.1.01.02.001', name: 'Banco Provincial, S.A.', type: AccountType.ACTIVO, isTransactional: true },
      { code: '1.1.01.02.002', name: 'Banesco Banco Universal', type: AccountType.ACTIVO, isTransactional: true },
      { code: '1.1.01.02.003', name: 'Banco de Venezuela', type: AccountType.ACTIVO, isTransactional: true },
      { code: '1.1.02', name: 'Cuentas por Cobrar Comerciales', type: AccountType.ACTIVO, isTransactional: false },
      { code: '1.1.02.01', name: 'Clientes Nacionales', type: AccountType.ACTIVO, isTransactional: true },
      { code: '1.1.02.02', name: 'Retenciones de IVA por Cobrar', type: AccountType.ACTIVO, isTransactional: true },
      { code: '1.1.02.03', name: 'Anticipos de ISLR (Retenciones)', type: AccountType.ACTIVO, isTransactional: true },
      { code: '1.1.03', name: 'Inventarios', type: AccountType.ACTIVO, isTransactional: false },
      { code: '1.1.03.01', name: 'Inventario de Mercancía', type: AccountType.ACTIVO, isTransactional: true },
      { code: '1.2', name: 'Activo No Corriente', type: AccountType.ACTIVO, isTransactional: false },
      { code: '1.2.01', name: 'Propiedades, Planta y Equipo', type: AccountType.ACTIVO, isTransactional: false },
      { code: '1.2.01.01', name: 'Terrenos', type: AccountType.ACTIVO, isTransactional: true },
      { code: '1.2.01.02', name: 'Edificios', type: AccountType.ACTIVO, isTransactional: true },
      { code: '1.2.01.03', name: 'Equipos de Computación', type: AccountType.ACTIVO, isTransactional: true },
      { code: '1.2.01.04', name: 'Depreciación Acumulada PPE', type: AccountType.ACTIVO, isTransactional: true },

      // 2. PASIVOS
      { code: '2', name: 'Pasivo', type: AccountType.PASIVO, isTransactional: false },
      { code: '2.1', name: 'Pasivo Corriente', type: AccountType.PASIVO, isTransactional: false },
      { code: '2.1.01', name: 'Cuentas por Pagar Comerciales', type: AccountType.PASIVO, isTransactional: false },
      { code: '2.1.01.01', name: 'Proveedores Nacionales', type: AccountType.PASIVO, isTransactional: true },
      { code: '2.1.02', name: 'Obligaciones Tributarias por Enterar', type: AccountType.PASIVO, isTransactional: false },
      { code: '2.1.02.01', name: 'IVA Débito Fiscal', type: AccountType.PASIVO, isTransactional: true },
      { code: '2.1.02.02', name: 'Retenciones de IVA por Enterar', type: AccountType.PASIVO, isTransactional: true },
      { code: '2.1.02.03', name: 'Retenciones de ISLR por Enterar', type: AccountType.PASIVO, isTransactional: true },
      { code: '2.1.03', name: 'Obligaciones Laborales', type: AccountType.PASIVO, isTransactional: false },
      { code: '2.1.03.01', name: 'Sueldos y Salarios por Pagar', type: AccountType.PASIVO, isTransactional: true },
      { code: '2.1.03.02', name: 'Retenciones Laborales (SSO, SPF, LPH)', type: AccountType.PASIVO, isTransactional: true },

      // 3. PATRIMONIO
      { code: '3', name: 'Patrimonio Neto', type: AccountType.PATRIMONIO, isTransactional: false },
      { code: '3.1', name: 'Capital Social', type: AccountType.PATRIMONIO, isTransactional: false },
      { code: '3.1.01', name: 'Capital Suscrito y Pagado', type: AccountType.PATRIMONIO, isTransactional: true },
      { code: '3.2', name: 'Resultados Acumulados', type: AccountType.PATRIMONIO, isTransactional: false },
      { code: '3.2.01', name: 'Utilidades Retenidas', type: AccountType.PATRIMONIO, isTransactional: true },
      { code: '3.2.02', name: 'Pérdidas de Ejercicios Anteriores', type: AccountType.PATRIMONIO, isTransactional: true },
      { code: '3.2.03', name: 'Utilidad o Pérdida del Ejercicio', type: AccountType.PATRIMONIO, isTransactional: true },

      // 4. INGRESOS
      { code: '4', name: 'Ingresos', type: AccountType.INGRESO, isTransactional: false },
      { code: '4.1', name: 'Ingresos Operacionales', type: AccountType.INGRESO, isTransactional: false },
      { code: '4.1.01', name: 'Ventas de Mercancías', type: AccountType.INGRESO, isTransactional: false },
      { code: '4.1.01.01', name: 'Ventas Alícuota General (16%)', type: AccountType.INGRESO, isTransactional: true },
      { code: '4.1.01.02', name: 'Ventas Alícuota Reducida (8%)', type: AccountType.INGRESO, isTransactional: true },
      { code: '4.1.01.03', name: 'Ventas Exentas o Exoneradas', type: AccountType.INGRESO, isTransactional: true },

      // 5. COSTOS
      { code: '5', name: 'Costos', type: AccountType.COSTO, isTransactional: false },
      { code: '5.1', name: 'Costos de Ventas', type: AccountType.COSTO, isTransactional: false },
      { code: '5.1.01', name: 'Compras de Inventario', type: AccountType.COSTO, isTransactional: false },
      { code: '5.1.01.01', name: 'Compras Alícuota General (16%)', type: AccountType.COSTO, isTransactional: true },
      { code: '5.1.01.02', name: 'Compras Exentas o Exoneradas', type: AccountType.COSTO, isTransactional: true },

      // 6. GASTOS
      { code: '6', name: 'Gastos', type: AccountType.GASTO, isTransactional: false },
      { code: '6.1', name: 'Gastos Operacionales', type: AccountType.GASTO, isTransactional: false },
      { code: '6.1.01', name: 'Gastos de Personal', type: AccountType.GASTO, isTransactional: false },
      { code: '6.1.01.01', name: 'Sueldos y Salarios', type: AccountType.GASTO, isTransactional: true },
      { code: '6.1.01.02', name: 'Bono de Alimentación (Cesta Ticket)', type: AccountType.GASTO, isTransactional: true },
      { code: '6.1.01.03', name: 'Aportes Patronales', type: AccountType.GASTO, isTransactional: true },
      { code: '6.1.01.04', name: 'Prestaciones Sociales', type: AccountType.GASTO, isTransactional: true },
      { code: '6.1.02', name: 'Gastos Generales y de Administración', type: AccountType.GASTO, isTransactional: false },
      { code: '6.1.02.01', name: 'Servicios Públicos (Agua, Electricidad)', type: AccountType.GASTO, isTransactional: true },
      { code: '6.1.02.02', name: 'Gastos de Alquiler', type: AccountType.GASTO, isTransactional: true },
      { code: '6.1.02.03', name: 'Honorarios Profesionales', type: AccountType.GASTO, isTransactional: true },
      { code: '6.1.02.04', name: 'Papelería y Útiles de Oficina', type: AccountType.GASTO, isTransactional: true },
    ];

    // Resolve hierarchical parents sequentially
    const codeToIdMap = new Map<string, string>();

    for (const item of template) {
      const { code, name, type, isTransactional } = item;
      const parts = code.split('.');
      const level = parts.length;

      let parentId: string | null = null;
      if (level > 1) {
        const parentCode = parts.slice(0, -1).join('.');
        parentId = codeToIdMap.get(parentCode) || null;
      }

      const created = await this.prisma.accountingAccount.create({
        data: {
          code,
          name,
          type,
          level,
          isTransactional,
          parentId,
          companyId,
          tenantId,
        },
      });

      codeToIdMap.set(code, created.id);
    }

    return {
      message: `Plan de cuentas predefinido (VEN-NIF) importado con éxito. Se crearon ${template.length} cuentas.`,
    };
  }

  // Recursive in-memory tree builder
  private buildTree(accounts: any[]) {
    const map = new Map();
    accounts.forEach((acc) => {
      map.set(acc.id, { ...acc, children: [] });
    });

    const tree: any[] = [];
    accounts.forEach((acc) => {
      const mapped = map.get(acc.id);
      if (acc.parentId) {
        const parent = map.get(acc.parentId);
        if (parent) {
          parent.children.push(mapped);
        } else {
          // If parent is missing, put it at root to prevent loss of nodes
          tree.push(mapped);
        }
      } else {
        tree.push(mapped);
      }
    });

    return tree;
  }
}
