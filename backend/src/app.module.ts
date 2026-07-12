import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './shared/prisma/prisma.module';
import { AuthModule } from './identity/auth/auth.module';
import { MenuModule } from './core/menu/menu.module';
import { TenantModule } from './core/tenant/tenant.module';
import { CompanyModule } from './tenant-scoped/company/company.module';
import { UserModule } from './identity/user/user.module';
import { RoleModule } from './identity/role/role.module';
import { AccountingModule } from './company-scoped/accounting/accounting.module';
import { FiscalModule } from './company-scoped/fiscal/fiscal.module';
import { SuperAdminModule } from './core/super-admin/super-admin.module';
import { ReportsModule } from './company-scoped/reports/reports.module';
import { APP_GUARD, APP_FILTER } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { TenantMiddleware } from './shared/common/tenant-context/tenant.middleware';
import { I18nModule } from './shared/i18n/i18n.module';
import { I18nExceptionFilter } from './shared/i18n/i18n-exception.filter';

@Module({
  imports: [
    I18nModule,
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
    {
      provide: APP_FILTER,
      useClass: I18nExceptionFilter,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantMiddleware)
      .forRoutes('*');
  }
}

