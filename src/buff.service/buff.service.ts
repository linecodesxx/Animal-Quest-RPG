import { Injectable } from '@nestjs/common';
import { BuffType } from 'generated/prisma';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class BuffService {
  constructor(private prisma: PrismaService) {}

  async findOrCreateBuff(type: BuffType, value: number, forceNew = false) {
    if (!forceNew) {
      const existing = await this.prisma.buff.findFirst({
        where: { type, value },
      });
      if (existing) return existing;
    }
    return this.prisma.buff.create({ data: { type, value } });
  }

  async getBuffs(
    buffList: { type: BuffType; value: number }[],
    forceNew = false,
  ) {
    return Promise.all(
      buffList.map((buff) =>
        this.findOrCreateBuff(buff.type, buff.value, forceNew),
      ),
    );
  }

  async createBuff(
    type: BuffType,
    value: number,
    duration?: number,
    description?: string,
  ) {
    return this.prisma.buff.create({
      data: { type, value, duration, description },
    });
  }
}
