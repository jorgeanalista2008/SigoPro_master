import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

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

  // Helper to determine if account type is Debit-nature
  private isDebitNature(type: string): boolean {
    // Activos, Costos y Gastos son de naturaleza deudora (aumentan por el debe, disminuyen por el haber)
    return ['ACTIVO', 'COSTO', 'GASTO'].includes(type);
  }

  // 1. Libro Diario
  async getJournalBook(
    companyId: string,
    tenantId: string,
    startDate?: string,
    endDate?: string,
  ) {
    await this.verifyCompany(companyId, tenantId);

    const whereClause: Prisma.JournalEntryWhereInput = {
      companyId,
      tenantId,
    };

    if (startDate || endDate) {
      whereClause.date = {};
      if (startDate) {
        whereClause.date.gte = new Date(startDate);
      }
      if (endDate) {
        whereClause.date.lte = new Date(endDate);
      }
    }

    const entries = await this.prisma.journalEntry.findMany({
      where: whereClause,
      include: {
        lines: {
          include: {
            account: {
              select: {
                code: true,
                name: true,
                type: true,
              },
            },
          },
          orderBy: { debit: 'desc' }, // debits first as is standard in accounting
        },
      },
      orderBy: [
        { date: 'asc' },
        { number: 'asc' },
      ],
    });

    return entries;
  }

  // 2. Libro Mayor
  async getGeneralLedger(
    companyId: string,
    accountId: string,
    tenantId: string,
    startDate: string,
    endDate: string,
  ) {
    await this.verifyCompany(companyId, tenantId);

    // Verify account exists
    const account = await this.prisma.accountingAccount.findFirst({
      where: { id: accountId, companyId },
    });
    if (!account) {
      throw new NotFoundException(`La cuenta contable con ID ${accountId} no existe.`);
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Calculate Initial Balance (sum of entries before startDate)
    const initialLines = await this.prisma.journalEntryLine.findMany({
      where: {
        accountId,
        entry: {
          companyId,
          date: { lt: start },
        },
      },
      select: {
        debit: true,
        credit: true,
      },
    });

    let initialDebit = new Prisma.Decimal(0);
    let initialCredit = new Prisma.Decimal(0);
    for (const l of initialLines) {
      initialDebit = initialDebit.add(l.debit);
      initialCredit = initialCredit.add(l.credit);
    }

    let initialBalance = new Prisma.Decimal(0);
    const isDebit = this.isDebitNature(account.type);
    if (isDebit) {
      initialBalance = initialDebit.sub(initialCredit);
    } else {
      initialBalance = initialCredit.sub(initialDebit);
    }

    // Get current period lines
    const periodLines = await this.prisma.journalEntryLine.findMany({
      where: {
        accountId,
        entry: {
          companyId,
          date: {
            gte: start,
            lte: end,
          },
        },
      },
      include: {
        entry: {
          select: {
            number: true,
            date: true,
            description: true,
            reference: true,
          },
        },
      },
      orderBy: {
        entry: {
          date: 'asc',
        },
      },
    });

    // Compute running balance
    let currentBalance = initialBalance;
    const formattedLines = periodLines.map((line) => {
      const lineDebit = new Prisma.Decimal(line.debit);
      const lineCredit = new Prisma.Decimal(line.credit);

      if (isDebit) {
        currentBalance = currentBalance.add(lineDebit).sub(lineCredit);
      } else {
        currentBalance = currentBalance.add(lineCredit).sub(lineDebit);
      }

      return {
        id: line.id,
        date: line.entry.date,
        entryNumber: line.entry.number,
        description: line.description || line.entry.description,
        reference: line.entry.reference,
        debit: line.debit,
        credit: line.credit,
        balance: currentBalance.toNumber(),
      };
    });

    return {
      account: {
        id: account.id,
        code: account.code,
        name: account.name,
        type: account.type,
        isDebitNature: isDebit,
      },
      period: {
        startDate,
        endDate,
      },
      initialBalance: initialBalance.toNumber(),
      lines: formattedLines,
      finalBalance: currentBalance.toNumber(),
    };
  }

  // 3. Balanza de Comprobación
  async getTrialBalance(
    companyId: string,
    tenantId: string,
    startDate: string,
    endDate: string,
  ) {
    await this.verifyCompany(companyId, tenantId);

    const start = new Date(startDate);
    const end = new Date(endDate);

    // 1. Fetch all transactional accounts
    const accounts = await this.prisma.accountingAccount.findMany({
      where: { companyId, isTransactional: true },
      orderBy: { code: 'asc' },
    });

    // 2. Fetch all entries before start date to calculate initial balances in a single query
    const initialAggregates = await this.prisma.journalEntryLine.groupBy({
      by: ['accountId'],
      where: {
        entry: {
          companyId,
          date: { lt: start },
        },
      },
      _sum: {
        debit: true,
        credit: true,
      },
    });

    // Map aggregates for quick lookup
    const initialMap = new Map<string, { debit: Prisma.Decimal; credit: Prisma.Decimal }>();
    for (const agg of initialAggregates) {
      initialMap.set(agg.accountId, {
        debit: agg._sum.debit || new Prisma.Decimal(0),
        credit: agg._sum.credit || new Prisma.Decimal(0),
      });
    }

    // 3. Fetch all entries during the period
    const periodAggregates = await this.prisma.journalEntryLine.groupBy({
      by: ['accountId'],
      where: {
        entry: {
          companyId,
          date: {
            gte: start,
            lte: end,
          },
        },
      },
      _sum: {
        debit: true,
        credit: true,
      },
    });

    const periodMap = new Map<string, { debit: Prisma.Decimal; credit: Prisma.Decimal }>();
    for (const agg of periodAggregates) {
      periodMap.set(agg.accountId, {
        debit: agg._sum.debit || new Prisma.Decimal(0),
        credit: agg._sum.credit || new Prisma.Decimal(0),
      });
    }

    // 4. Build report rows
    let grandTotalInitialDebit = new Prisma.Decimal(0);
    let grandTotalInitialCredit = new Prisma.Decimal(0);
    let grandTotalDebit = new Prisma.Decimal(0);
    let grandTotalCredit = new Prisma.Decimal(0);
    let grandTotalFinalDebit = new Prisma.Decimal(0);
    let grandTotalFinalCredit = new Prisma.Decimal(0);

    const rows = accounts.map((acc) => {
      const isDebit = this.isDebitNature(acc.type);

      // Initial
      const initValues = initialMap.get(acc.id) || { debit: new Prisma.Decimal(0), credit: new Prisma.Decimal(0) };
      let initialBalance = new Prisma.Decimal(0);
      if (isDebit) {
        initialBalance = initValues.debit.sub(initValues.credit);
        grandTotalInitialDebit = grandTotalInitialDebit.add(initialBalance.greaterThan(0) ? initialBalance : 0);
        grandTotalInitialCredit = grandTotalInitialCredit.add(initialBalance.lessThan(0) ? initialBalance.abs() : 0);
      } else {
        initialBalance = initValues.credit.sub(initValues.debit);
        grandTotalInitialCredit = grandTotalInitialCredit.add(initialBalance.greaterThan(0) ? initialBalance : 0);
        grandTotalInitialDebit = grandTotalInitialDebit.add(initialBalance.lessThan(0) ? initialBalance.abs() : 0);
      }

      // Period
      const periodValues = periodMap.get(acc.id) || { debit: new Prisma.Decimal(0), credit: new Prisma.Decimal(0) };
      grandTotalDebit = grandTotalDebit.add(periodValues.debit);
      grandTotalCredit = grandTotalCredit.add(periodValues.credit);

      // Final Balance
      let finalBalance = new Prisma.Decimal(0);
      if (isDebit) {
        finalBalance = initialBalance.add(periodValues.debit).sub(periodValues.credit);
        grandTotalFinalDebit = grandTotalFinalDebit.add(finalBalance.greaterThan(0) ? finalBalance : 0);
        grandTotalFinalCredit = grandTotalFinalCredit.add(finalBalance.lessThan(0) ? finalBalance.abs() : 0);
      } else {
        finalBalance = initialBalance.add(periodValues.credit).sub(periodValues.debit);
        grandTotalFinalCredit = grandTotalFinalCredit.add(finalBalance.greaterThan(0) ? finalBalance : 0);
        grandTotalFinalDebit = grandTotalFinalDebit.add(finalBalance.lessThan(0) ? finalBalance.abs() : 0);
      }

      return {
        accountId: acc.id,
        code: acc.code,
        name: acc.name,
        type: acc.type,
        isDebitNature: isDebit,
        initialBalance: initialBalance.toNumber(),
        debit: periodValues.debit.toNumber(),
        credit: periodValues.credit.toNumber(),
        finalBalance: finalBalance.toNumber(),
      };
    });

    return {
      period: {
        startDate,
        endDate,
      },
      rows,
      totals: {
        initialDebit: grandTotalInitialDebit.toNumber(),
        initialCredit: grandTotalInitialCredit.toNumber(),
        debit: grandTotalDebit.toNumber(),
        credit: grandTotalCredit.toNumber(),
        finalDebit: grandTotalFinalDebit.toNumber(),
        finalCredit: grandTotalFinalCredit.toNumber(),
      },
    };
  }
}
