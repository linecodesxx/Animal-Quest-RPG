import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  async addNewItemToInventory(
    name: string,
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
}
