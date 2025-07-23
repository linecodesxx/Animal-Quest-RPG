import { UserService } from './../user/user.service';
import { Command, Ctx, On, Start, Update } from 'nestjs-telegraf';
import { BotService } from './bot.service';
import { Context } from 'telegraf';
import { AnimalSpawnService } from 'src/animal-spawn.service/animal-spawn.service';
import { InventoryService } from 'src/inventory/inventory.service';
import { AdminGuard } from 'src/common/guards/admin.guard';
import { UseGuards } from '@nestjs/common';

@Update()
export class BotUpdate {
  constructor(
    private botService: BotService,
    private animalSpawnService: AnimalSpawnService,
    private userService: UserService,
    private inventoryService: InventoryService,
  ) {}

  @Start()
  async onStart(@Ctx() ctx: Context) {
    const user = await this.botService.findOrCreateUser(ctx);
    await ctx.reply(
      `Привет, ${user?.username || 'Пушистик'}! Добро пожаловать в RPG! 🐾\n` +
        'Используй /find_pet чтобы найти животных для ловли! \n' +
        'Для отписки от уведомлений о спавне животных - /unsubscribe',
    );
  }

  @Command('me')
  async meInfo(@Ctx() ctx: Context) {
    if (!ctx.from) return;
    const telegramId = String(ctx.from.id);
    const character =
      await this.userService.getUserCharacterByTelegramId(telegramId);

    if (!character) {
      await ctx.reply(
        'У вас ещё нет персонажа. Попробуйте поймать животное через /find_pet!',
      );
      return;
    }
    const msg = `🧍 Ваш персонаж:
👤 Имя: ${character.name}
📈 Уровень: ${character.level}
❤️ Здоровье: ${character.health}
🎒 Предметов в инвентаре: ${character.inventory.length}
📅 Создан: ${new Date(character.createdAt).toLocaleDateString()}
  `;

    await ctx.reply(msg);
  }

  @Command('find_pet')
  async findAnimals(@Ctx() ctx: Context) {
    const spawns = await this.animalSpawnService.getActiveSpawns();

    if (spawns.length === 0) {
      await ctx.reply('Сейчас нет доступных животных. Попробуйте позже!');
      return;
    }

    for (const spawn of spawns) {
      await ctx.reply(
        `🐾 Найдено: ${spawn.animal.type}\n` +
          `🕒 Исчезнет через: ${Math.round((spawn.despawnAt.getTime() - Date.now()) / 60000)} мин\n` +
          `🎯 Используй кнопку снизу чтобы попробовать поймать!`,
        {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: `Поймать ${spawn.animal.type}!`,
                  callback_data: `catch_${spawn.id}`,
                },
              ],
            ],
          },
        },
      );
    }
  }

  @On('callback_query')
  async handleCatch(@Ctx() ctx: Context) {
    const data = (ctx.callbackQuery as any).data;
    if (!data.startsWith('catch_')) return;

    const spawnId = parseInt(data.split('_')[1]);
    const user = await this.botService.findOrCreateUser(ctx);

    if (!user) {
      await ctx.answerCbQuery('Ошибка пользователя');
      return;
    }

    const result = await this.animalSpawnService.catchAnimal(user.id, spawnId);
    await ctx.editMessageText(result);
  }

  @Command('unsubscribe')
  async unsubscribe(@Ctx() ctx: Context) {
    const telegramId = ctx.from?.id;
    if (!telegramId) return;

    await this.userService.updateByTelegramId(telegramId, {
      notifyOnAnimalSpawn: false,
    });

    await ctx.reply(
      'Ты успешно отписался от уведомлений о животных 🐾 \n ' +
        'Подписаться снова - /subscribe',
    );
  }

  @Command('subscribe')
  async subscribe(@Ctx() ctx: Context) {
    const telegramId = ctx.from?.id;
    if (!telegramId) return;

    await this.userService.updateByTelegramId(telegramId, {
      notifyOnAnimalSpawn: true,
    });

    await ctx.reply(
      'Ты снова подписан на уведомления о животных 🐾 \n' +
        'Отписаться - /usubscribe',
    );
  }

  @UseGuards(AdminGuard)
  @Command('news')
  async news(@Ctx() ctx: Context) {
    const message = ctx.message;
    if (!message || !('text' in message)) return;

    const fullText = message.text.trim(); // "/news Текст объявления"
    const announcement = fullText.slice(6).trim(); // отрезаем "/news" (5 символов + пробел)

    if (!announcement) {
      await ctx.reply(
        'Пожалуйста, напиши объявление после команды. Пример:\n/news Сегодня в 18:00 будет ивент!',
      );
      return;
    }

    // Можно сохранить или отправить дальше
    await ctx.reply(`📢 Объявление отправлено`);
    await this.botService.sendMessageToUsers(`📢 Объявление:\n${announcement}`);
  }

  @Command('inventory')
  async getInv(@Ctx() ctx: Context) {
    if (!ctx.from) return;
    const telegramId = String(ctx.from.id);
    const character =
      await this.userService.getUserCharacterByTelegramId(telegramId);

    if (!character) {
      await ctx.reply(
        'У вас ещё нет персонажа. Попробуйте поймать животное через /find_pet!',
      );
      return;
    }
    const items = await this.inventoryService.getInventory(character.id);

    const formatted = items
      .map((item, index) => `${index + 1}. ${item.name} ×${item.quantity}`)
      .join('\n');

    if (formatted.length === 0) {
      await ctx.reply('🎒 Ваш инвентарь пуст...');
    } else {
      await ctx.reply(`🎒 Ваш инвентарь:\n${formatted}`);
    }
  }

  @UseGuards(AdminGuard)
  @Command('give')
  async giveItem(@Ctx() ctx: Context) {
    const message = ctx.message;
    if (!message || !('text' in message)) return;

    const args = message.text.split(' ').slice(1); // ['@username', 'hamster']
    const [item, usernameArg] = args;

    if (!item || !usernameArg) {
      await ctx.reply('Неверный формат. Используй: /give item @username');
      return;
    }

    const username = usernameArg.replace('@', '');
    const targetUser = await this.userService.getUserByUsername(username);
    if (!targetUser) {
      await ctx.reply(`❌ Пользователь @${username} не найден.`);
      return;
    }
    if (!targetUser.telegramId) {
      await ctx.reply(`❌ У пользователя @${username} не задан Telegram ID.`);
      return;
    }
    const targetCharacter = await this.userService.getUserCharacterByTelegramId(
      targetUser.telegramId,
    );
    if (!targetCharacter) {
      await ctx.reply(`❌ У пользователя @${username} нет персонажа.`);
      return;
    }

    await this.inventoryService.addNewItemToInventory(
      item,
      1,
      targetCharacter.id,
    );

    await ctx.reply(`✅ Предмет "${item}" выдан @${username}.`);
    await this.botService.sendMessageToTelegramId(
      targetUser.telegramId, // тут уже точно string, а не null
      `🎁 Вам был выдан предмет: ${item}!`,
    );
  }

  @UseGuards(AdminGuard)
  @Command('clear_inventory')
  async clearInventory(@Ctx() ctx: Context) {
    const message = ctx.message;
    if (!message || !('text' in message)) return;

    const args = message.text.split(' ').slice(1); // ['/clear_inventory', '@username']
    const usernameArg = args[0];

    if (!usernameArg) {
      await ctx.reply('Неверный формат. Используй: /clear_inventory @username');
      return;
    }

    const username = usernameArg.replace('@', '');
    const targetUser = await this.userService.getUserByUsername(username);

    if (!targetUser || !targetUser.characters[0]) {
      await ctx.reply(
        `Не найден пользователь с именем @${username} или у него нет персонажа.`,
      );
      return;
    }

    if (!targetUser || !targetUser.characters.length) {
      await ctx.reply('У пользователя нет персонажа.');
      return;
    }

    await this.inventoryService.clearInventory(targetUser.characters[0].id);

    await ctx.reply(`🧹 Инвентарь пользователя @${username} был очищен!`);
    await this.botService.sendMessageToTelegramId(
      `Ваш инвентарь был очищен администратором... (；＿；)`,
      targetUser.telegramId!, // убедись, что telegramId точно не null
    );
  }
}
