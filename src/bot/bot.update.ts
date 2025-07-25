import { UserService } from './../user/user.service';
import { Command, Ctx, On, Start, Update } from 'nestjs-telegraf';
import { BotService } from './bot.service';
import { Context } from 'telegraf';
import { AnimalSpawnService } from 'src/animal-spawn.service/animal-spawn.service';
import { InventoryService } from 'src/inventory/inventory.service';
import { AdminGuard } from 'src/common/guards/admin.guard';
import { NotImplementedException, UseGuards } from '@nestjs/common';
import { BuffType, ItemType } from 'generated/prisma';
import { BotHandlers } from './handlers/bot.handlers';
import { CharacterService } from 'src/character/character.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { parseBuffs } from 'src/common/utils/parser';
import { parseArgs } from '../common/utils/parser';
import { FoodService } from 'src/food.service/food.service';
import { WeaponService } from 'src/weapon.service/weapon.service';
import { ArmorService } from 'src/armor.service/armor.service';
import { BuffService } from 'src/buff.service/buff.service';

/**
 * Сделать настройки персонажа с инлайн кнопками
 * без комманд через / (строка 271)
 *
 * Сделать сбор животных чтобы он приносил опыт
 *
 * Сделать ежедневный бонус (/bonus или кнопка)
 *
 * Сделать чтобы можно было видеть профили других при реплае на них
 *
 * Сделать чтобы персонажа можно было сдавтать в приют
 *
 * Добавить экономику: рынок, валюту, места для заработка, кулдауны между работой
 *
 * Сделать квесты
 *
 * Доделать функции инвентаря use/drop и тд
 */

@Update()
export class BotUpdate {
  constructor(
    private botService: BotService,
    private animalSpawnService: AnimalSpawnService,
    private userService: UserService,
    private inventoryService: InventoryService,
    private botHandlers: BotHandlers,
    private characterService: CharacterService,
    private foodService: FoodService,
    private weaponService: WeaponService,
    private armorService: ArmorService,
    private buffService: BuffService,
    private prisma: PrismaService,
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
    // Считаем общее количество предметов по quantity
    const totalItems = character.inventory.reduce(
      (sum, item) => sum + (item.quantity ?? 0),
      0,
    );
    // 🧍 Ваш персонаж:${animal.type}
    const msg = `🧍 Ваш персонаж: 
👤 Имя: ${character.name}
📈 Уровень: ${character.level} (0/10 ~> ${character.level + 1}) 
🌠 Класс: ${character.class}
❤️ Здоровье: ${character.health}/${character.maxHealth}
🍗 Голод: ${character.hungry}/${character.maxHungry}
💰 Монеты: ${character.cash}
🫡 Репутация: ${character.rep}
🗺️ Выполненные квесты: {quests.done}
🎒 Предметов в инвентаре: ${totalItems}
  `;

    await ctx.reply(msg, {
      reply_markup: {
        inline_keyboard: [
          [
            { text: 'Броня', callback_data: `armor:${character.id}` },
            { text: 'Оружие', callback_data: `swords:${character.id}` },
          ],
          [
            { text: 'Аксессуары', callback_data: `acsessoirs:${character.id}` },
            { text: 'Настройки', callback_data: `settings:${character.id}` },
          ],
          [{ text: 'Инвентарь', callback_data: `inventory:${character.id}` }],
        ],
      },
    });
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

    const keyboard = items.map((item) => [
      {
        text: `${item.name} x${item.quantity}`,
        callback_data: `item:${item.id}`,
      },
    ]);
    if (formatted.length === 0) {
      await ctx.reply('🎒 Ваш инвентарь пуст...', {
        reply_markup: {
          inline_keyboard: [[{ text: 'Назад', callback_data: 'me:back' }]],
        },
      });
    } else {
      await ctx.reply(`🎒 Ваш инвентарь:\n${formatted}`, {
        reply_markup: {
          inline_keyboard: [
            ...keyboard,
            [{ text: 'Назад', callback_data: 'me:back' }],
          ],
        },
      });
    }
  }

  @Command('settings')
  async settings() {
    throw new NotImplementedException('NotImplemeted');
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

  @UseGuards(AdminGuard)
  @Command('give')
  async giveItem(@Ctx() ctx: Context) {
    const message = ctx.message;
    if (!message || !('text' in message)) return;

    const args = message.text.split(' ').slice(1); // ['FOOD', 'apple', '@username']
    const [userTypeRaw, itemName, usernameArg] = args;

    const validItemTypes = Object.values(ItemType);
    if (!validItemTypes.includes(userTypeRaw as ItemType)) {
      await ctx.reply(
        `Неверный тип предмета. Допустимые типы: ${validItemTypes.join(', ')}`,
      );
      return;
    }
    const itemType = userTypeRaw as ItemType;

    if (!itemName || !usernameArg) {
      await ctx.reply(
        'Неверный формат. Используй: /give <ItemType> <itemName> @username',
      );
      return;
    }

    const username = usernameArg.startsWith('@')
      ? usernameArg.slice(1)
      : usernameArg;
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

    // Найдём связанный предмет в зависимости от типа
    let weaponId: number | undefined = undefined;
    let armorId: number | undefined = undefined;
    let foodId: number | undefined = undefined;

    if (itemType === ItemType.SWORD) {
      const weapon = await this.prisma.weapon.findFirst({
        where: { name: itemName },
      });
      if (!weapon) {
        await ctx.reply(`❌ Меч "${itemName}" не найден в базе.`);
        return;
      }
      weaponId = weapon.id;
    } else if (itemType === ItemType.ARMOR) {
      const armor = await this.prisma.armor.findFirst({
        where: { name: itemName },
      });
      if (!armor) {
        await ctx.reply(`❌ Броня "${itemName}" не найдена в базе.`);
        return;
      }
      armorId = armor.id;
    } else if (itemType === ItemType.FOOD) {
      const food = await this.prisma.food.findFirst({
        where: { name: itemName },
      });
      if (!food) {
        await ctx.reply(`❌ Еда "${itemName}" не найдена в базе.`);
        return;
      }
      foodId = food.id;
    }

    // Создаём InventoryItem с ссылкой на предмет или с резервным именем
    await this.prisma.inventoryItem.create({
      data: {
        characterId: targetCharacter.id,
        quantity: 1,
        type: itemType,
        weaponId,
        armorId,
        foodId,
        name: !weaponId && !armorId && !foodId ? itemName : null,
      },
    });

    await ctx.reply(`✅ Предмет "${itemName}" выдан @${username}.`);
    await this.botService.sendMessageToTelegramId(
      targetUser.telegramId,
      `🎁 Вам был выдан предмет: ${itemName}!`,
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

  @UseGuards(AdminGuard)
  @Command('set_1_health')
  async set1health(@Ctx() ctx: Context) {
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

    await this.characterService.set1health(targetUser.characters[0].id);

    await ctx.reply('Здоровье стало 1');
  }

  @Command('create_weapon')
  async createWeapon(@Ctx() ctx: Context) {
    if (!ctx.message || !('text' in ctx.message)) {
      await ctx.reply('Please send a text message');
      return;
    }

    try {
      const args = parseArgs(ctx.message.text);
      const buffsInput = args.buffs as string | undefined;

      const buffs = buffsInput
        ? parseBuffs(buffsInput)?.map((b) => {
            if (!Object.values(BuffType).includes(b.type as BuffType)) {
              throw new Error(`Invalid buff type: ${b.type}`);
            }
            return {
              type: b.type as BuffType,
              value: b.value,
            };
          })
        : undefined;

      const weapon = await this.weaponService.createWeapon({
        name: args.name as string,
        attack: parseInt(args.attack as string),
        classReqName: args.classReq as string | undefined,
        rarity: args.rarity as string | undefined,
        type: args.type as string | undefined,
        buffs,
        forceNew: args.forceNew === 'true',
      });

      await ctx.reply(`✅ Создано оружие: ${weapon.name}`);
    } catch (err) {
      console.error(err);
      await ctx.reply(
        '❌ Ошибка при создании оружия: ' +
          (err instanceof Error ? err.message : String(err)),
      );
    }
  }

  @Command('create_armor')
  async createArmor(@Ctx() ctx: Context) {
    if (!ctx.message || !('text' in ctx.message)) {
      await ctx.reply('Please send a text message');
      return;
    }

    try {
      const args = parseArgs(ctx.message.text);
      const buffsInput = args.buffs as string | undefined;

      const buffs = buffsInput
        ? parseBuffs(buffsInput)?.map((b) => ({
            type: b.type as BuffType,
            value: b.value,
          }))
        : undefined;

      const armor = await this.armorService.createArmor({
        name: args.name as string,
        defense: parseInt(args.defense as string),
        classReqName: args.classReq as string | undefined,
        rarity: args.rarity as string | undefined,
        type: args.type as string | undefined,
        buffs,
        forceNew: args.forceNew === 'true',
      });

      await ctx.reply(`✅ Создана броня: ${armor.name}`);
    } catch (err) {
      console.error(err);
      await ctx.reply(
        '❌ Ошибка при создании брони: ' +
          (err instanceof Error ? err.message : String(err)),
      );
    }
  }

  @Command('create_food')
  async createFood(@Ctx() ctx: Context) {
    if (!ctx.message || !('text' in ctx.message)) {
      await ctx.reply('Please send a text message');
      return;
    }

    try {
      const args = parseArgs(ctx.message.text);
      const buffsInput = args.buffs as string | undefined;

      const buffs = buffsInput
        ? parseBuffs(buffsInput)?.map((b) => ({
            type: b.type as BuffType,
            value: b.value,
          }))
        : undefined;

      const food = await this.foodService.createFood({
        name: args.name as string,
        healValue: args.healValue
          ? parseInt(args.healValue as string)
          : undefined,
        hungryValue: args.hungryValue
          ? parseInt(args.hungryValue as string)
          : undefined,
        description: args.description as string | undefined,
        buffs,
        forceNew: args.forceNew === 'true',
      });

      await ctx.reply(`✅ Создана еда: ${food.name}`);
    } catch (err) {
      console.error(err);
      await ctx.reply(
        '❌ Ошибка при создании еды: ' +
          (err instanceof Error ? err.message : String(err)),
      );
    }
  }

  @Command('create_buff')
  async createBuff(@Ctx() ctx: Context) {
    if (!ctx.message || !('text' in ctx.message)) {
      await ctx.reply('Please send a text message');
      return;
    }

    try {
      const args = parseArgs(ctx.message.text);

      const buff = await this.buffService.createBuff(
        args.type as BuffType,
        parseInt(args.value as string),
        args.duration
          ? parseInt(args.duration as string)
          : undefined,
        args.description as string | undefined,
      );

      await ctx.reply(`✅ Бафф создан: ${buff.type} +${buff.value}`);
    } catch (err) {
      console.error(err);
      await ctx.reply(
        '❌ Ошибка при создании баффа: ' +
          (err instanceof Error ? err.message : String(err)),
      );
    }
  }

  @On('callback_query')
  async handleCallbackQuery(@Ctx() ctx: Context) {
    let data: string | undefined;
    if (
      ctx.callbackQuery &&
      'data' in ctx.callbackQuery &&
      typeof (ctx.callbackQuery as any).data === 'string'
    ) {
      data = (ctx.callbackQuery as { data: string }).data;
    }

    if (!data) {
      await ctx.answerCbQuery('Некорректный callback_query');
      return;
    }
    if (data.startsWith('catch_')) {
      // Готово: Ловля животных
      await this.botHandlers.handleCatchAnimal(ctx, data);
      return;
    }
    if (data.startsWith('item:')) {
      await this.botHandlers.handleShowItem(ctx, data);
      return;
    }
    if (data.startsWith('use:')) {
      await this.botHandlers.handleUseItem(ctx, data);
      return;
    }
    if (data.startsWith('drop:')) {
      await this.botHandlers.handleDropItem(ctx, data);
      return;
    }
    if (data.startsWith('inventory:back')) {
      await this.botHandlers.handleBackToInventory(ctx);
      return;
    }
    if (data.startsWith('inventory:')) {
      await this.botHandlers.handleInventoryCheck(ctx);
      return;
    }
    if (data.startsWith('armor:')) {
      await this.botHandlers.handleArmorCheck(ctx);
      return;
    }

    if (data.startsWith('me:back')) {
      await this.botHandlers.handleBackToMe(ctx);
      return;
    }
  }
}
