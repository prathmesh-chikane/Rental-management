import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller.js';
import { UsersModule } from './users/users.module.js';
import { OrganizationsModule } from './organizations/organizations.module.js';
import { AuthModule } from './auth/auth.module.js';
import { PropertiesModule } from './properties/properties.module.js';
import { TenantsModule } from './tenants/tenants.module.js';
import { UnitsModule } from './Units/units.module.js';
import { LeasesModule } from './leases/leases.module.js';
import { InvoicesModule } from './invoices/invoices.module.js';
import { MaintenanceModule } from './maintenance/maintenance.module.js';
import { StaffModule } from './staff-venders/staff.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.getOrThrow<string>('MONGODB_URI'),
        serverSelectionTimeoutMS: 5000,
        lazyConnection: true,
      }),
    }),

    UsersModule,

    OrganizationsModule,

    AuthModule,

    PropertiesModule,

    UnitsModule,

    TenantsModule,

    LeasesModule,

    InvoicesModule,

    MaintenanceModule,

    StaffModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule { }
