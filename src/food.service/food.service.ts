import { Injectable } from '@nestjs/common';
import { BuffType } from 'generated/prisma';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class FoodService {
  constructor(private prisma: PrismaService) {}

  async createFood(data: {
    name: string;
    healValue?: number;
    hungryValue?: number;
    description?: string;
    buffs?: { type: BuffType; value: number }[];
    forceNew?: boolean;
  }) {
    const buffs = await Promise.all(
      (data.buffs ?? []).map(async (buff) => {
        if (!data.forceNew) {
          const existing = await this.prisma.buff.findFirst({
            where: { type: buff.type, value: buff.value },
          });
          if (existing) return existing;
        }
        return this.prisma.buff.create({
          data: { type: buff.type, value: buff.value },
        });
      }),
    );

    return this.prisma.food.create({
      data: {
        name: data.name,
        healValue: data.healValue ?? 0,
        hungryValue: data.hungryValue ?? 0,
        description: data.description,
        buffs: { connect: buffs.map((b) => ({ id: b.id })) },
      },
    });
  }
}
