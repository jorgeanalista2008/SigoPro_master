import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { MenuModule } from './menu/menu.module';
import { TenantModule } from './tenant/tenant.module';
import { CompanyModule } from './company/company.module';
import { UserModule } from './user/user.module';
import { RoleModule } from './role/role.module';
import { AccountingModule } from './accounting/accounting.module';
import { FiscalModule } from './fiscal/fiscal.module';
import { SuperAdminModule } from './super-admin/super-admin.module';
import { ReportsModule } from './reports/reports.module';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    MenuModule,
    TenantModule,
    CompanyModule,
    UserModule,
    RoleModule,
    AccountingModule,
    FiscalModule,
    SuperAdminModule,
    ReportsModule,
    ThrottlerModule.forRoot([{
      ttl: 60000, // 1 minute
      limit: 60,   // limit each IP to 60 requests per ttl
    }]),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
