import { Module } from '@nestjs/common';
import { AccountingService } from './accounting.service';
import { AccountingController } from './accounting.controller';
import { JournalEntryService } from './journal-entry.service';
import { JournalEntryController } from './journal-entry.controller';

@Module({
  controllers: [AccountingController, JournalEntryController],
  providers: [AccountingService, JournalEntryService],
  exports: [JournalEntryService],
})
export class AccountingModule {}
