import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { JournalEntryService } from '../accounting/journal-entry.service';
import { CreateTaxDocumentDto, TaxDocumentType } from './dto/create-tax-document.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class TaxDocumentService {
  constructor(
    private prisma: PrismaService,
    private journalEntryService: JournalEntryService,
  ) {}

  private async verifyCompany(companyId: string, tenantId: string, txClient?: any) {
    const prisma = txClient || this.prisma;
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

  // Helper to dynamically resolve target accounts by code preference or name pattern
  private async resolveAccount(companyId: string, codes: string[], nameLike: string, txClient?: any) {
    const prisma = txClient || this.prisma;
    // 1. Try resolving by seeded codes first
    for (const code of codes) {
      const acc = await prisma.accountingAccount.findFirst({
        where: { companyId, code },
      });
      if (acc && acc.isTransactional) return acc;
    }

    // 2. Fall back to finding a matching transactional account by name query
    const accByName = await prisma.accountingAccount.findFirst({
      where: {
        companyId,
        name: { contains: nameLike, mode: 'insensitive' },
        isTransactional: true,
      },
    });

    if (accByName) return accByName;

    throw new BadRequestException(
      `Configuración faltante: No se encontró una cuenta contable transaccional para [${nameLike}] ` +
        `(códigos probados: ${codes.join(', ')}). Por favor créala en el Plan de Cuentas.`,
    );
  }

  async create(companyId: string, createDto: CreateTaxDocumentDto, tenantId: string) {
    return this.prisma.$transaction(async (tx) => {
      await this.verifyCompany(companyId, tenantId, tx);
      const {
        type,
        documentType,
        invoiceNumber,
        controlNumber,
        rif,
        name,
        date,
        subtotal: subtotalRaw,
        ivaRate,
        ivaWithholdingRate,
        retentionVoucherNumber,
        retentionDate,
        islrWithholdingRate,
        autoPost,
        expenseAccountId,
        revenueAccountId,
      } = createDto;

      // 1. Check if invoice number is already registered for this type in this company
      const existing = await tx.taxDocument.findFirst({
        where: { companyId, invoiceNumber, type },
      });
      if (existing) {
        throw new ConflictException(
          `Ya existe un documento de tipo ${type} con el número de factura ${invoiceNumber} en esta empresa.`,
        );
      }

      // 2. Perform Venezuelan fiscal math using Decimal for precision
      const subtotal = new Prisma.Decimal(subtotalRaw);
      const rate = new Prisma.Decimal(ivaRate !== undefined ? ivaRate : 16.0);
      const ivaAmount = subtotal.mul(rate.div(100)).toDecimalPlaces(2);
      const total = subtotal.add(ivaAmount);

      let ivaWithheld = new Prisma.Decimal(0);
      if (ivaWithholdingRate) {
        const withRate = new Prisma.Decimal(ivaWithholdingRate);
        ivaWithheld = ivaAmount.mul(withRate.div(100)).toDecimalPlaces(2);
      }

      let islrWithheld = new Prisma.Decimal(0);
      if (islrWithholdingRate) {
        const islrRate = new Prisma.Decimal(islrWithholdingRate);
        islrWithheld = subtotal.mul(islrRate.div(100)).toDecimalPlaces(2);
      }

      // 3. Auto-post integration (verify account references before committing doc)
      let journalEntryId: string | undefined;

      if (autoPost !== false) {
        if (type === TaxDocumentType.COMPRA) {
          if (!expenseAccountId) {
            throw new BadRequestException('El campo expenseAccountId es requerido para auto-asentar Compras.');
          }

          // Resolve required accounts for Purchases
          const ivaCreditAccount = await this.resolveAccount(
            companyId,
            ['1.1.02.02', '1.1.02.04'],
            'Credito Fiscal',
            tx,
          );
          const ivaEnterarAccount = await this.resolveAccount(
            companyId,
            ['2.1.02.02'],
            'Retenciones de IVA por Enterar',
            tx,
          );
          const islrEnterarAccount = await this.resolveAccount(
            companyId,
            ['2.1.02.03'],
            'Retenciones de ISLR por Enterar',
            tx,
          );
          const accountsPayable = await this.resolveAccount(
            companyId,
            ['2.1.01.01', '2.1.01'],
            'Proveedores',
            tx,
          );

          // Build double-entry lines
          const lines = [
            // Debit: Cost / Expense
            { accountId: expenseAccountId, debit: subtotal.toNumber(), credit: 0, description: `Base compra Fact ${invoiceNumber}` },
            // Debit: IVA Crédito Fiscal
            { accountId: ivaCreditAccount.id, debit: ivaAmount.toNumber(), credit: 0, description: `IVA Crédito Fiscal Fact ${invoiceNumber}` },
          ];

          // Credit: IVA Withheld
          if (ivaWithheld.greaterThan(0)) {
            lines.push({
              accountId: ivaEnterarAccount.id,
              debit: 0,
              credit: ivaWithheld.toNumber(),
              description: `Retención IVA ${ivaWithholdingRate}% Fact ${invoiceNumber}`,
            });
          }

          // Credit: ISLR Withheld
          if (islrWithheld.greaterThan(0)) {
            lines.push({
              accountId: islrEnterarAccount.id,
              debit: 0,
              credit: islrWithheld.toNumber(),
              description: `Retención ISLR ${islrWithholdingRate}% Fact ${invoiceNumber}`,
            });
          }

          // Credit: Accounts Payable (net total)
          const netPayable = total.sub(ivaWithheld).sub(islrWithheld);
          lines.push({
            accountId: accountsPayable.id,
            debit: 0,
            credit: netPayable.toNumber(),
            description: `Total Neto a Pagar Fact ${invoiceNumber}`,
          });

          // Post Journal Entry within current transaction
          const entry = await this.journalEntryService.create(
            companyId,
            {
              date,
              description: `Registro Compra: ${name} (Fact ${invoiceNumber})`,
              reference: controlNumber,
              lines,
            },
            tenantId,
            tx,
          );

          journalEntryId = entry?.id;
        } else {
          // VENTA (Sale)
          if (!revenueAccountId) {
            throw new BadRequestException('El campo revenueAccountId es requerido para auto-asentar Ventas.');
          }

          // Resolve required accounts for Sales
          const ivaDebitAccount = await this.resolveAccount(
            companyId,
            ['2.1.02.01'],
            'Debito Fiscal',
            tx,
          );
          const ivaCobrarAccount = await this.resolveAccount(
            companyId,
            ['1.1.02.02'],
            'Retenciones de IVA por Cobrar',
            tx,
          );
          const islrAnticipoAccount = await this.resolveAccount(
            companyId,
            ['1.1.02.03'],
            'Anticipos de ISLR',
            tx,
          );
          const accountsReceivable = await this.resolveAccount(
            companyId,
            ['1.1.02.01', '1.1.02'],
            'Clientes',
            tx,
          );

          // Build double-entry lines
          const lines = [
            // Credit: Revenue
            { accountId: revenueAccountId, debit: 0, credit: subtotal.toNumber(), description: `Base venta Fact ${invoiceNumber}` },
            // Credit: IVA Débito Fiscal
            { accountId: ivaDebitAccount.id, debit: 0, credit: ivaAmount.toNumber(), description: `IVA Débito Fiscal Fact ${invoiceNumber}` },
          ];

          // Debit: IVA Withheld by Client
          if (ivaWithheld.greaterThan(0)) {
            lines.push({
              accountId: ivaCobrarAccount.id,
              debit: ivaWithheld.toNumber(),
              credit: 0,
              description: `Retención IVA Cliente Fact ${invoiceNumber}`,
            });
          }

          // Debit: ISLR Withheld by Client
          if (islrWithheld.greaterThan(0)) {
            lines.push({
              accountId: islrAnticipoAccount.id,
              debit: islrWithheld.toNumber(),
              credit: 0,
              description: `Retención ISLR Cliente Fact ${invoiceNumber}`,
            });
          }

          // Debit: Accounts Receivable (net total to collect)
          const netReceivable = total.sub(ivaWithheld).sub(islrWithheld);
          lines.push({
            accountId: accountsReceivable.id,
            debit: netReceivable.toNumber(),
            credit: 0,
            description: `Total Neto a Cobrar Fact ${invoiceNumber}`,
          });

          // Post Journal Entry within current transaction
          const entry = await this.journalEntryService.create(
            companyId,
            {
              date,
              description: `Registro Venta: ${name} (Fact ${invoiceNumber})`,
              reference: controlNumber,
              lines,
            },
            tenantId,
            tx,
          );

          journalEntryId = entry?.id;
        }
      }

      // 4. Save the Tax Document
      return tx.taxDocument.create({
        data: {
          type,
          documentType,
          invoiceNumber,
          controlNumber,
          rif,
          name,
          date: new Date(date),
          subtotal,
          ivaRate: rate,
          ivaAmount,
          total,
          ivaWithholdingRate,
          ivaWithheld: ivaWithheld.greaterThan(0) ? ivaWithheld : null,
          retentionVoucherNumber,
          retentionDate: retentionDate ? new Date(retentionDate) : null,
          islrWithholdingRate,
          islrWithheld: islrWithheld.greaterThan(0) ? islrWithheld : null,
          companyId,
          tenantId,
          journalEntryId,
        },
      });
    });
  }

  async getLibroCompras(companyId: string, year: number, month: number, tenantId: string) {
    await this.verifyCompany(companyId, tenantId);

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    return this.prisma.taxDocument.findMany({
      where: {
        companyId,
        type: 'COMPRA',
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: 'asc' },
    });
  }

  async getLibroVentas(companyId: string, year: number, month: number, tenantId: string) {
    await this.verifyCompany(companyId, tenantId);

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    return this.prisma.taxDocument.findMany({
      where: {
        companyId,
        type: 'VENTA',
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: 'asc' },
    });
  }
}
