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
      // const itemId = parseInt(data.split(':')[1]);
      // await this.inventoryService.useItem(itemId); // твоя реализация

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
}
