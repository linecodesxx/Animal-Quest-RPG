import { Module } from '@nestjs/common';
import { BotService } from './bot.service';
import { UserModule } from 'src/user/user.module';
import { TelegrafModule, TelegrafModuleOptions } from 'nestjs-telegraf';
import { BotUpdate } from './bot.update';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AnimalSpawnModule } from 'src/animal-spawn.service/animal-spawn.module';
import { InventoryModule } from 'src/inventory/inventory.module';
import { BotHandlers } from './handlers/bot.handlers';
import { CharacterService } from 'src/character/character.service';
import { FoodService } from 'src/food.service/food.service';
import { ArmorService } from 'src/armor.service/armor.service';
import { BuffService } from 'src/buff.service/buff.service';
import { WeaponService } from 'src/weapon.service/weapon.service';

@Module({
  imports: [
    ConfigModule,
    AnimalSpawnModule,
    UserModule,
    InventoryModule,
    TelegrafModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService): TelegrafModuleOptions => {
        const token = configService.get<string>('TELEGRAM_BOT_TOKEN');
        if (!token) {
          throw new Error('BOT_TOKEN not defined in environment');
        }
        return { token, launchOptions: { dropPendingUpdates: true } };
      },
    }),
  ],
  providers: [
    BotService,
    BotUpdate,
    BotHandlers,
    CharacterService,
    FoodService,
    ArmorService,
    BuffService,
    WeaponService
  ],
  exports: [BotService],
})
export class BotModule {}
