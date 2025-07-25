import { Injectable } from '@nestjs/common';
import { ItemType } from 'generated/prisma';
import { CharacterService } from 'src/character/character.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class InventoryService {
  itemtype = [
    { type: 'ЕДА', prisma_type: ItemType.FOOD },
    { type: 'БРОНЯ', prisma_type: ItemType.ARMOR },
    { type: 'АКСЕССУАР', prisma_type: ItemType.ACCESSORY },
    { type: 'МАГИЧЕСКИЙ СВИТОК', prisma_type: ItemType.MAGIC_SCROLL },
    { type: 'МЕЧ', prisma_type: ItemType.SWORD },
    { type: 'ЗЕЛЬЕ', prisma_type: ItemType.POTION },
    { type: 'ЦЕННОСТЬ', prisma_type: ItemType.TREASURE },
    { type: 'ИНСТРУМЕНТ', prisma_type: ItemType.TOOL },
    { type: 'ПУСТОТА', prisma_type: ItemType.EMPTY },
  ];

  constructor(
    private prisma: PrismaService,
    private character: CharacterService,
  ) {}

  async addNewItemToInventory(
    name: string,
    type: ItemType,
    amount: number = 1,
    characterId: number,
  ) {
    const existingItem = await this.prisma.inventoryItem.findFirst({
      where: {
        name,
        characterId,
      },
    });

    if (existingItem) {
      return await this.prisma.inventoryItem.update({
        where: { id: existingItem.id },
        data: { quantity: { increment: amount } },
      });
    }

    return await this.prisma.inventoryItem.create({
      data: {
        characterId,
        name,
        type: type,
        quantity: amount,
      },
    });
  }

  async getInventory(characterId: number) {
    return await this.prisma.inventoryItem.findMany({
      where: { characterId: characterId },
    });
  }

  async clearInventory(characterId: number): Promise<void> {
    await this.prisma.inventoryItem.deleteMany({
      where: { characterId },
    });
  }

  async getItemById(id: number, characterId: number) {
    return await this.prisma.inventoryItem.findFirst({
      where: { id: id, characterId: characterId },
      include: {
        food: true,
        weapon: true,
        armor: true,
      },
    });
  }

  async dropItem(itemId: number, characterId: number) {
    const item = await this.getItemById(itemId, characterId);

    if (!item) return;

    if (item.quantity > 1) {
      // 👇 Уменьшаем количество, если больше 1
      await this.prisma.inventoryItem.update({
        where: { id: item.id },
        data: { quantity: item.quantity - 1 },
      });
    } else {
      // 👇 Удаляем полностью, если осталась 1 штука
      await this.prisma.inventoryItem.delete({
        where: { id: item.id },
      });
    }
  }

  async useItem(itemId: number, characterId: number) {
    const item = await this.getItemById(itemId, characterId);
    const character = await this.prisma.character.findFirst({
      where: { id: characterId },
    });

    if (!item) return;

    if (item.type === ItemType.FOOD) {
      const foodData = item.food;
      if (!foodData) return; // страховка

      if (character && character.hungry < 10) {
        await this.character.hungryUp(character.id, foodData.hungryValue);
        await this.character.heal(character.id, foodData.healValue);
      }

      if (item.quantity > 1) {
        await this.prisma.inventoryItem.update({
          where: { id: item.id },
          data: { quantity: { decrement: 1 } },
        });
      } else {
        await this.prisma.inventoryItem.delete({
          where: { id: item.id },
        });
      }
    } else if (item.type === ItemType.POTION) {
      // Зелья
      return;
    }
  }
}
