import { Module } from '@nestjs/common';
import { TaxDocumentService } from './tax-document.service';
import { FiscalController } from './fiscal.controller';
import { AccountingModule } from '../accounting/accounting.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule, AccountingModule],
  controllers: [FiscalController],
  providers: [TaxDocumentService],
})
export class FiscalModule {}
