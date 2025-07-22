import { UserService } from './../user/user.service';
import { Command, Ctx, On, Start, Update } from 'nestjs-telegraf';
import { BotService } from './bot.service';
import { Context } from 'telegraf';
import { PrismaService } from 'src/prisma/prisma.service';
import { AnimalSpawnService } from 'src/animal-spawn.service/animal-spawn.service';

@Update()
export class BotUpdate {
  constructor(
    private botService: BotService,
    private animalSpawnService: AnimalSpawnService,
    private userService: UserService
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

   @Command("me")
   async meInfo(@Ctx() ctx: Context){
    if(!ctx.from) return;
    const telegramId = String(ctx.from.id);
    const character = await this.userService.getUserCharacterByTelegramId(telegramId);

    if(!character){
        await ctx.reply('У вас ещё нет персонажа. Попробуйте поймать животное через /find_pet!');
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

  await ctx.reply('Ты успешно отписался от уведомлений о животных 🐾 \n ' + 
    'Подписаться снова - /subscribe'
  );
}

@Command('subscribe')
async subscribe(@Ctx() ctx: Context) {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  await this.userService.updateByTelegramId(telegramId, {
    notifyOnAnimalSpawn: true,
  });

  await ctx.reply('Ты снова подписан на уведомления о животных 🐾 \n' +
    'Отписаться - /usubscribe'
  );
}

@Command("news")
async news(@Ctx() ctx: Context){
const message = ctx.message;
  if (!message || !('text' in message)) return;

  const fullText = message.text.trim();             // "/news Текст объявления"
  const announcement = fullText.slice(6).trim();    // отрезаем "/news" (5 символов + пробел)

  if (!announcement) {
    await ctx.reply('Пожалуйста, напиши объявление после команды. Пример:\n/news Сегодня в 18:00 будет ивент!');
    return;
  }

  // Можно сохранить или отправить дальше
  await ctx.reply(`📢 Объявление отправлено`);
  await this.botService.sendMessageToUsers(`📢 Объявление:\n${announcement}`)
}

}
