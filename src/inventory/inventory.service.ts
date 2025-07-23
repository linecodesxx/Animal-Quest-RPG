import { Injectable } from '@nestjs/common';
import { ItemType } from 'generated/prisma';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class InventoryService {
  itemtype = [
    { type: 'ЕДА', prisma_type: ItemType.FOOD },
    { type: 'БРОНЯ', prisma_type: ItemType.ARMOR },
    { type: 'АКСЕССУАР', prisma_type: ItemType.ACCESSORY },
    { type: 'МАГИЧЕСКИЙ СВИТОК', prisma_type: ItemType.MAGIC_SCROLL },
    { type: 'МЕЧ', prisma_type: ItemType.SWORDS },
    { type: 'ЗЕЛЬЕ', prisma_type: ItemType.POTION },
    { type: 'ЦЕННОСТЬ', prisma_type: ItemType.TREASURE },
    { type: 'ИНСТРУМЕНТ', prisma_type: ItemType.TOOL },
    { type: 'ПУСТОТА', prisma_type: ItemType.EMPTY },
  ];

  constructor(private prisma: PrismaService) {}

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
    });
  }
}
