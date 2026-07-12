import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JournalEntryService } from './journal-entry.service';
import { CreateJournalEntryDto } from './dto/create-journal-entry.dto';
import { JwtAuthGuard } from '../../identity/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../identity/auth/guards/permissions.guard';
import { RequirePermissions } from '../../identity/auth/decorators/permissions.decorator';
import { CurrentUser } from '../../identity/auth/decorators/current-user.decorator';
import { AuditLogInterceptor } from '../../shared/common/interceptors/audit-log.interceptor';
import { Audit } from '../../shared/common/decorators/audit.decorator';

@ApiTags('Asientos Contables / Comprobantes de Diario')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@UseInterceptors(AuditLogInterceptor)
@Controller('companies/:companyId/journal-entries')
export class JournalEntryController {
  constructor(private readonly journalEntryService: JournalEntryService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('accounting:write')
  @Audit('CREATE_JOURNAL_ENTRY', 'JournalEntry')
  @ApiOperation({ summary: 'Registrar un nuevo asiento contable general (Partida Doble obligatoria)' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Asiento contable registrado con éxito.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Monto de cuadre inválido (Debe != Haber) o cuentas no válidas.',
  })
  create(
    @Param('companyId') companyId: string,
    @Body() createDto: CreateJournalEntryDto,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.journalEntryService.create(companyId, createDto, tenantId);
  }

  @Get()
  @RequirePermissions('accounting:read')
  @ApiOperation({ summary: 'Listar todos los asientos contables de la empresa' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Listado de asientos obtenido con éxito.',
  })
  findAll(
    @Param('companyId') companyId: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.journalEntryService.findAll(companyId, tenantId);
  }

  @Get(':id')
  @RequirePermissions('accounting:read')
  @ApiOperation({ summary: 'Obtener detalles de un asiento contable por su ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Detalles del asiento contable obtenidos con éxito.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Asiento contable no encontrado.',
  })
  findOne(
    @Param('companyId') companyId: string,
    @Param('id') id: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.journalEntryService.findOne(id, companyId, tenantId);
  }
}
