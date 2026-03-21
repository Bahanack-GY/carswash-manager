import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    SequelizeModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        dialect: 'postgres',
        host: config.get('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get('DB_USERNAME', 'postgres'),
        password: config.get('DB_PASSWORD', 'postgres'),
        database: config.get('DB_NAME', 'lis_car_wash'),
        autoLoadModels: true,
        synchronize: true,
        sync: { alter: true },
        logging: false,
        pool: {
          min: 2,
          max: Number(config.get('DB_POOL_MAX', '20')),
          acquire: 30000,
          idle: 10000,
        },
      }),
    }),
  ],
})
export class DatabaseModule {}
