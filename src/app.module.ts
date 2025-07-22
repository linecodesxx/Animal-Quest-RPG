import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { BotModule } from './bot/bot.module';
import { UserModule } from './user/user.module';
import { CharacterModule } from './character/character.module';
import { QuestModule } from './quest/quest.module';
import { InventoryModule } from './inventory/inventory.module';
import { BattleModule } from './battle/battle.module';
import { CommonModule } from './common/common.module';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AnimalSpawnModule } from './animal-spawn.service/animal-spawn.module';
import { AnimalSpawnService } from './animal-spawn.service/animal-spawn.service';
import { AnimalInitService } from './animal-init.service/animal-init.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AnimalSpawnModule,
    ScheduleModule.forRoot(),
    PrismaModule,
    BotModule,
    UserModule,
    CharacterModule,
    QuestModule,
    InventoryModule,
    BattleModule,
    CommonModule,
    AnimalSpawnModule,
  ],
  controllers: [AppController],
  providers: [AppService, AnimalInitService],
})
export class AppModule {}
