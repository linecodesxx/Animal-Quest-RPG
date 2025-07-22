import { Context, Telegraf } from 'telegraf';
import { UserService } from './../user/user.service';
import { Injectable } from '@nestjs/common';
import { InjectBot, Ctx } from 'nestjs-telegraf';

@Injectable()
export class BotService {
  constructor(
    private readonly userService: UserService,
    @InjectBot() private bot: Telegraf,
  ) {}

  async findOrCreateUser(ctx: Context) {
    if (!ctx.from) return;
    const telegramId = ctx.from.id.toString();
    const username = ctx.from.username || undefined;

    let user = await this.userService.findByTelegramId(telegramId);
    if (!user) {
      user = await this.userService.createUser(telegramId, username);
    }
    return user;
  }

  async sendMessageToUsers(
    message: string,
    filter?: Partial<{ notifyOnAnimalSpawn: boolean }>,
  ) {
    const users = await this.userService.findUsersWithTelegramIds(filter);

    for (const user of users) {
      try {
        if (user.telegramId) {
          await this.bot.telegram.sendMessage(user.telegramId, message);
        }
      } catch (error) {
        console.error(
          `❌ Ошибка при отправке пользователю ${user.telegramId}:`,
          error,
        );
      }
    }
  }

  async sendMessageToTelegramId(telegramId: string, message: string) {
  try {
    await this.bot.telegram.sendMessage(telegramId, message);
  } catch (error) {
    console.error(`❌ Ошибка при отправке ${telegramId}:`, error);
  }
}

}
