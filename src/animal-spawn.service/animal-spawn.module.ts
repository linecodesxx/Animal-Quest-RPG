import { Module, forwardRef } from '@nestjs/common';
import { AnimalSpawnService } from './animal-spawn.service';
import { PrismaService } from '../prisma/prisma.service';
import { BotModule } from 'src/bot/bot.module';

@Module({
  imports: [forwardRef(() => BotModule)],
  providers: [AnimalSpawnService, PrismaService],
  exports: [AnimalSpawnService],
})
export class AnimalSpawnModule {}
