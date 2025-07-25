import { Module } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { CharacterService } from 'src/character/character.service';

@Module({
  imports: [PrismaModule],
  providers: [InventoryService, CharacterService],
  controllers: [InventoryController],
  exports: [InventoryService],
})
export class InventoryModule {}
