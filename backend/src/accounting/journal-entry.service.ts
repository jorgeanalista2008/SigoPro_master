import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateJournalEntryDto } from './dto/create-journal-entry.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class JournalEntryService {
  constructor(private prisma: PrismaService) {}

  private async verifyCompany(companyId: string, tenantId: string, prismaInstance?: any) {
    const prisma = prismaInstance || this.prisma;
    const company = await prisma.company.findFirst({
      where: { id: companyId, tenantId },
    });
    if (!company) {
      throw new NotFoundException(
        `Empresa con ID ${companyId} no existe o no pertenece a tu cuenta.`,
      );
    }
    return company;
  }

  async create(
    companyId: string,
    createDto: CreateJournalEntryDto,
    tenantId: string,
    txClient?: Prisma.TransactionClient,
  ) {
    // 1. Partida Doble Check: Sum(debit) must equal Sum(credit)
    let totalDebit = new Prisma.Decimal(0);
    let totalCredit = new Prisma.Decimal(0);
    for (const line of createDto.lines) {
      totalDebit = totalDebit.add(new Prisma.Decimal(line.debit || 0));
      totalCredit = totalCredit.add(new Prisma.Decimal(line.credit || 0));
    }

    if (totalDebit.sub(totalCredit).abs().greaterThan(0.01)) {
      throw new BadRequestException(
        `Partida Doble Inválida: El total al Debe (${totalDebit.toFixed(2)}) debe ser igual al total al Haber (${totalCredit.toFixed(2)}). Diferencia: ${totalDebit.sub(totalCredit).abs().toFixed(2)}`,
      );
    }

    // 2. Validate all accounts are transactional and belong to the company
    const prisma = txClient || this.prisma;
    await this.verifyCompany(companyId, tenantId, prisma);

    for (const line of createDto.lines) {
      const acc = await prisma.accountingAccount.findFirst({
        where: { id: line.accountId, companyId },
      });
      if (!acc) {
        throw new BadRequestException(
          `La cuenta contable con ID ${line.accountId} no existe en esta empresa.`,
        );
      }
      if (!acc.isTransactional) {
        throw new BadRequestException(
          `La cuenta ${acc.code} - ${acc.name} es acumuladora y no permite registrar transacciones directas.`,
        );
      }
    }

    // 3. Generate sequential entry number for this company
    const lastEntry = await prisma.journalEntry.findFirst({
      where: { companyId },
      orderBy: { number: 'desc' },
    });
    const nextNumber = lastEntry ? lastEntry.number + 1 : 1;

    // Helper execute function for actual creation
    const execute = async (tx: Prisma.TransactionClient) => {
      const entry = await tx.journalEntry.create({
        data: {
          number: nextNumber,
          date: new Date(createDto.date),
          description: createDto.description,
          reference: createDto.reference,
          companyId,
          tenantId,
        },
      });

      for (const line of createDto.lines) {
        await tx.journalEntryLine.create({
          data: {
            entryId: entry.id,
            accountId: line.accountId,
            debit: new Prisma.Decimal(line.debit || 0),
            credit: new Prisma.Decimal(line.credit || 0),
            description: line.description,
          },
        });
      }

      return tx.journalEntry.findUnique({
        where: { id: entry.id },
        include: {
          lines: {
            include: {
              account: {
                select: {
                  code: true,
                  name: true,
                },
              },
            },
          },
        },
      });
    };

    // If txClient is passed, use it directly (it's already in a transaction). Otherwise, start a new transaction.
    if (txClient) {
      return execute(txClient);
    } else {
      return this.prisma.$transaction(async (tx) => {
        return execute(tx);
      });
    }
  }

  async findAll(companyId: string, tenantId: string) {
    await this.verifyCompany(companyId, tenantId);

    return this.prisma.journalEntry.findMany({
      where: { companyId },
      include: {
        lines: {
          include: {
            account: {
              select: {
                code: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { number: 'desc' },
    });
  }

  async findOne(id: string, companyId: string, tenantId: string) {
    await this.verifyCompany(companyId, tenantId);

    const entry = await this.prisma.journalEntry.findFirst({
      where: { id, companyId },
      include: {
        lines: {
          include: {
            account: {
              select: {
                code: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!entry) {
      throw new NotFoundException(`Asiento contable con ID ${id} no encontrado.`);
    }

    return entry;
  }
}
