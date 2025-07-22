import { Module } from '@nestjs/common';
import { QuestService } from './quest.service';
import { QuestController } from './quest.controller';

@Module({
  providers: [QuestService],
  controllers: [QuestController]
})
export class QuestModule {}
