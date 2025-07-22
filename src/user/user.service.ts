import { Injectable } from '@nestjs/common';
import { User } from 'generated/prisma';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async findByTelegramId(telegramId: string) {
    return this.prisma.user.findUnique({ where: { telegramId } });
  }
  async createUser(telegramId: string, username?: string) {
    return this.prisma.user.create({
      data: {
        telegramId,
        username,
      },
    });
  }
  async findUsersWithTelegramIds(
    filter?: Partial<{ notifyOnAnimalSpawn: boolean }>,
  ) {
    return this.prisma.user.findMany({
      where: {
        telegramId: {
          not: null,
        },
        ...(filter?.notifyOnAnimalSpawn !== undefined
          ? { notifyOnAnimalSpawn: filter.notifyOnAnimalSpawn }
          : {}),
      },
    });
  }

  async getUserCharacterByTelegramId(telegramId: string) {
    const user = await this.prisma.user.findUnique({
      where: { telegramId },
      include: {
        characters: {
          include: {
            inventory: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });
    return user?.characters[0] || null;
  }

  async updateByTelegramId(telegramId: number, data: Partial<User>) {
    return this.prisma.user.updateMany({
      where: {
        telegramId: String(telegramId),
      },
      data,
    });
  }

  async getUserByUsername(username: string) {
    return await this.prisma.user.findUnique({
      where: { username },
      include: { characters: true },
    });
  }
}
