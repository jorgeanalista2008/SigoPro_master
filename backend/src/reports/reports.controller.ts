import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Reportes Contables')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('companies/:companyId/reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('journal')
  @RequirePermissions('accounting:read')
  @ApiOperation({ summary: 'Generar Libro Diario' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Fecha inicio (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'Fecha fin (YYYY-MM-DD)' })
  getJournalBook(
    @Param('companyId') companyId: string,
    @CurrentUser('tenantId') tenantId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.getJournalBook(companyId, tenantId, startDate, endDate);
  }

  @Get('ledger')
  @RequirePermissions('accounting:read')
  @ApiOperation({ summary: 'Generar Libro Mayor para una cuenta' })
  @ApiQuery({ name: 'accountId', required: true, description: 'ID de la cuenta contable' })
  @ApiQuery({ name: 'startDate', required: true, description: 'Fecha inicio (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: true, description: 'Fecha fin (YYYY-MM-DD)' })
  getGeneralLedger(
    @Param('companyId') companyId: string,
    @CurrentUser('tenantId') tenantId: string,
    @Query('accountId') accountId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.reportsService.getGeneralLedger(companyId, accountId, tenantId, startDate, endDate);
  }

  @Get('trial-balance')
  @RequirePermissions('accounting:read')
  @ApiOperation({ summary: 'Generar Balanza de Comprobación' })
  @ApiQuery({ name: 'startDate', required: true, description: 'Fecha inicio (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: true, description: 'Fecha fin (YYYY-MM-DD)' })
  getTrialBalance(
    @Param('companyId') companyId: string,
    @CurrentUser('tenantId') tenantId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.reportsService.getTrialBalance(companyId, tenantId, startDate, endDate);
  }
}
