import { Injectable } from '@nestjs/common';
import { BuffType } from 'generated/prisma';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ArmorService {
  constructor(private prisma: PrismaService) {}

  async createArmor(data: {
    name: string;
    defense: number;
    classReqName?: string;
    rarity?: string;
    type?: string;
    buffs?: { type: BuffType; value: number }[];
    forceNew?: boolean;
  }) {
    const classReq = data.classReqName
      ? await this.prisma.characterClass.findUnique({
          where: { name: data.classReqName },
        })
      : null;

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

    return this.prisma.armor.create({
      data: {
        name: data.name,
        defense: data.defense,
        classReqId: classReq?.id,
        rarity: data.rarity,
        type: data.type as any,
        buffs: { connect: buffs.map((b) => ({ id: b.id })) },
      },
    });
  }
}
