import { Injectable } from '@nestjs/common';
import { InventoryItem } from 'generated/prisma';
import { AnimalSpawnService } from 'src/animal-spawn.service/animal-spawn.service';
import { InventoryService } from 'src/inventory/inventory.service';
import { UserService } from 'src/user/user.service';
import { Context } from 'telegraf';
import { BotService } from '../bot.service';

@Injectable()
export class BotHandlers {
  constructor(
    private readonly botService: BotService,
    private readonly animalSpawnService: AnimalSpawnService,
    private readonly userService: UserService,
    private readonly inventoryService: InventoryService,
  ) {}

  public async handleCatchAnimal(ctx: Context, data: string): Promise<void> {
    const spawnId = parseInt(data.split('_')[1]);
    const user = await this.botService.findOrCreateUser(ctx);

    if (!user) {
      await ctx.answerCbQuery('Ошибка пользователя');
      return;
    }

    const result = await this.animalSpawnService.catchAnimal(user.id, spawnId);
    await ctx.editMessageText(result);
  }

  public async handleInventoryCheck(ctx: Context) {
    if (!ctx.from) return;
    const telegramId = String(ctx.from.id);
    const character =
      await this.userService.getUserCharacterByTelegramId(telegramId);

    if (!character) {
      await ctx.editMessageText(
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

    const backButton = [
      {
        text: 'Назад',
        callback_data: 'me:back',
      },
    ];

    if (formatted.length === 0) {
      await ctx.editMessageText('🎒 Ваш инвентарь пуст...', {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: 'Назад',
                callback_data: `me:back`,
              },
            ],
          ],
        },
      });
    } else {
      await ctx.editMessageText(`🎒 Ваш инвентарь:\n${formatted}`, {
        reply_markup: {
          inline_keyboard: [...keyboard, backButton],
        },
      });
    }
  }

  public async handleShowItem(ctx: Context, data: string): Promise<void> {
    if (!ctx.from) return;

    const telegramId = String(ctx.from.id);
    const character =
      await this.userService.getUserCharacterByTelegramId(telegramId);

    if (!character) {
      await ctx.answerCbQuery('❌ Персонаж не найден');
      return;
    }

    const itemId = parseInt(data.split(':')[1]);
    const item = await this.inventoryService.getItemById(itemId, character.id);

    if (!item) {
      await ctx.answerCbQuery('❌ Предмет не найден');
      return;
    }

    try {
      await ctx.editMessageText(`🔍 ${item.name} ×${item.quantity}`, {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '🥄 Использовать', callback_data: `use:${item.id}` },
              { text: '🗑️ Выбросить', callback_data: `drop:${item.id}` },
            ],
            [{ text: '🔙 Назад', callback_data: 'inventory:back' }],
          ],
        },
      });
      await ctx.answerCbQuery();
    } catch (e) {
      console.error('[ERROR] editMessageText failed:', e);
      await ctx.answerCbQuery('⚠️ Ошибка при обновлении сообщения');
    }
  }

  public async handleUseItem(ctx: Context, data: string): Promise<void> {
    try {
      if (!ctx.from) return;

      const telegramId = String(ctx.from.id);
      const character =
        await this.userService.getUserCharacterByTelegramId(telegramId);
      const itemId = parseInt(data.split(':')[1]);

      if (!character) {
        await ctx.answerCbQuery('❌ Персонаж не найден');
        return;
      }

      await this.inventoryService.useItem(itemId, character.id);

      await ctx.answerCbQuery('🍽️ Использовано!');
      await this.handleBackToInventory(ctx);
    } catch (error) {
      console.error('Ошибка при useItem:', error);
      await ctx.answerCbQuery('⚠️ Ошибка использования.');
    }
  }

  public async handleDropItem(ctx: Context, data: string): Promise<void> {
    try {
      if (!ctx.from) return;

      const telegramId = String(ctx.from.id);
      const character =
        await this.userService.getUserCharacterByTelegramId(telegramId);

      const itemId = parseInt(data.split(':')[1]);
      if (!character) {
        await ctx.answerCbQuery('❌ Персонаж не найден');
        return;
      }
      await this.inventoryService.dropItem(itemId, character.id);

      await ctx.answerCbQuery('🗑️ Выброшено!');
      await this.handleBackToInventory(ctx);
    } catch (error) {
      console.error('Ошибка при dropItem:', error);
      await ctx.answerCbQuery('⚠️ Ошибка при выбрасывании.');
    }
  }

  public async handleBackToInventory(ctx: Context): Promise<void> {
    const telegramId = String(ctx.from?.id);
    const character =
      await this.userService.getUserCharacterByTelegramId(telegramId);
    if (!character) {
      await ctx.editMessageText('⚠️ Персонаж не найден');
      return;
    }
    const items: InventoryItem[] = await this.inventoryService.getInventory(
      character.id,
    );
    if (!items.length) {
      await ctx.editMessageText('🎒 Ваш инвентарь пуст.');
      return;
    }
    const keyboard = items.map((item: InventoryItem) => [
      {
        text: `${item.name} ×${item.quantity}`,
        callback_data: `item:${item.id}`,
      },
    ]);
    await ctx.editMessageText('🎒 Ваш инвентарь:', {
      reply_markup: {
        inline_keyboard: keyboard,
      },
    });
    await ctx.answerCbQuery();
  }

  public async habdleBackToSettings(ctx: Context) {
    const telegramId = String(ctx.from?.id);
    const character =
      await this.userService.getUserCharacterByTelegramId(telegramId);
    if (!character) {
      await ctx.editMessageText('⚠️ Персонаж не найден');
      return;
    }
  }

  public async handleBackToMe(ctx: Context) {
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

    await ctx.editMessageText(msg, {
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

  public async handleArmorCheck(ctx: Context) {
    const telegramId = String(ctx.from?.id);
    const character =
      await this.userService.getUserCharacterByTelegramId(telegramId);
    if (!character) {
      await ctx.editMessageText('⚠️ Персонаж не найден');
      return;
    }

    const armor = character.armor;

    if (!armor)
      return await ctx.editMessageText(`На тебе нет брони`, {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: 'Назад',
                callback_data: `me:back`,
              },
            ],
          ],
        },
      });

    await ctx.answerCbQuery();
  }
}
