import { Ctx } from 'nestjs-telegraf';
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { BotService } from 'src/bot/bot.service';
import { Context } from 'telegraf';
import {User} from '../../generated/prisma'

@Injectable()
export class AnimalSpawnService {
  private readonly logger = new Logger(AnimalSpawnService.name);
    private msg;
  constructor(
    private prisma: PrismaService,
    private botService: BotService
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async spawnGlobalAnimal(@Ctx() ctx: Context) {
    this.logger.debug('Starting global animal spawn...');

    // 1. Clear expired spawns
    await this.prisma.animalSpawn.deleteMany({
      where: {
        OR: [{ despawnAt: { lt: new Date() } }, { isCaught: true }],
      },
    });

    // 2. Get random animal
    const animals = await this.prisma.animal.findMany();
    if (animals.length === 0) {
      this.logger.warn('No animals available for spawning');
      return;
    }

    const randomAnimal = animals[Math.floor(Math.random() * animals.length)];
    const despawnAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // 3. Create new spawn
    try {
      await this.prisma.animalSpawn.create({
        data: {
          animalId: randomAnimal.id,
          despawnAt: despawnAt,
        },
      });
      this.logger.log(`Spawned ${randomAnimal.type} until ${despawnAt}`);

      this.msg = "Заспавнилось новое животное! Скорее проверь /find_pet \n " +
      "Для отписки от уведомлений о спавне животных - /unsubscribe"
      await this.botService.sendMessageToUsers(this.msg, {notifyOnAnimalSpawn: true,})
        } catch (error) {
      this.logger.error('Failed to spawn animal', error);
    }
  }

  async getActiveSpawns() {
    return this.prisma.animalSpawn.findMany({
      where: {
        despawnAt: { gt: new Date() },
        isCaught: false,
      },
      include: { animal: true },
    });
  }

  async catchAnimal(userId: number, spawnId: number): Promise<string> {
    // 1. Check if user already has a character
    const hasCharacter = await this.prisma.character.count({
      where: { userId },
    });
    if (hasCharacter > 0) return 'У вас уже есть персонаж!';

    try {
      // 2. Verify spawn is available
      const spawn = await this.prisma.animalSpawn.findFirst({
        where: {
          id: spawnId,
          despawnAt: { gt: new Date() },
          isCaught: false,
        },
        include: { animal: true },
      });
      if (!spawn) return 'Животное уже поймано или сбежало!';

      // 3. Create character (animal type becomes character name)
      const character = await this.prisma.character.create({
        data: {
          name: spawn.animal.type,
          userId: userId,
          health: 100,
          level: 1,
        },
      });

      // 4. Mark spawn as caught
      await this.prisma.animalSpawn.update({
        where: { id: spawnId },
        data: {
          isCaught: true,
          caughtById: character.id,
        },
      });

      return `🎉 Поздравляем! Вы поймали ${spawn.animal.type}!`;
    } catch (error) {
      this.logger.error('Catch error', error);
      return 'Ошибка при попытке поймать животное';
    }
  }
}
